import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Eye, Settings, BarChart3 } from 'lucide-react';
import JsBarcode from 'jsbarcode';

interface EtiquetteTemplate {
  id: string;
  nom: string;
  type: 'LIVRE' | 'UTILISATEUR' | 'RAYONNAGE';
  format: string;
  largeurMm: number;
  hauteurMm: number;
  templateHtml: string;
  templateCss: string;
}

interface EtiquetteData {
  id: string;
  titre?: string;
  auteur?: string;
  cote?: string;
  isbn?: string;
  codeBarres?: string;
  nom?: string;
  prenom?: string;
  numeroLecteur?: string;
  rayonnage?: string;
  categorie?: string;
}

const GenerateurEtiquettes: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EtiquetteTemplate | null>(null);
  const [etiquettesData, setEtiquettesData] = useState<EtiquetteData[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const templates: EtiquetteTemplate[] = [
    {
      id: 'livre-standard',
      nom: 'Étiquette Livre Standard',
      type: 'LIVRE',
      format: 'A4',
      largeurMm: 70,
      hauteurMm: 37,
      templateHtml: `
        <div class="etiquette">
          <div class="titre">{{titre}}</div>
          <div class="auteur">{{auteur}}</div>
          <div class="cote">{{cote}}</div>
          <div class="code-barres">{{codeBarres}}</div>
        </div>
      `,
      templateCss: `
        .etiquette { 
          font-family: Arial, sans-serif; 
          font-size: 10px; 
          padding: 2mm; 
          border: 1px solid #ccc;
          width: 70mm;
          height: 37mm;
          box-sizing: border-box;
        }
        .titre { 
          font-weight: bold; 
          margin-bottom: 1mm; 
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .auteur { 
          font-style: italic; 
          margin-bottom: 1mm; 
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cote { 
          font-size: 12px; 
          font-weight: bold; 
          margin-bottom: 2mm; 
          background: #f0f0f0;
          padding: 1mm;
          text-align: center;
        }
        .code-barres { 
          font-family: monospace; 
          font-size: 8px; 
          text-align: center;
          margin-top: 2mm;
        }
      `
    },
    {
      id: 'utilisateur-carte',
      nom: 'Carte Utilisateur',
      type: 'UTILISATEUR',
      format: 'Carte',
      largeurMm: 85,
      hauteurMm: 54,
      templateHtml: `
        <div class="carte">
          <div class="header">BIBLIOTHÈQUE ESTA</div>
          <div class="nom">{{prenom}} {{nom}}</div>
          <div class="numero">N° {{numeroLecteur}}</div>
          <div class="code-barres">{{codeBarres}}</div>
        </div>
      `,
      templateCss: `
        .carte {
          font-family: Arial, sans-serif;
          width: 85mm;
          height: 54mm;
          border: 2px solid #0066cc;
          border-radius: 5px;
          padding: 3mm;
          box-sizing: border-box;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .header {
          font-size: 12px;
          font-weight: bold;
          color: #0066cc;
          text-align: center;
          margin-bottom: 3mm;
        }
        .nom {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 2mm;
        }
        .numero {
          font-size: 10px;
          color: #666;
          margin-bottom: 3mm;
        }
        .code-barres {
          font-family: monospace;
          font-size: 8px;
          text-align: center;
        }
      `
    }
  ];

  const generateBarcode = (text: string): string => {
    if (!canvasRef.current) return '';
    
    try {
      JsBarcode(canvasRef.current, text, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: false
      });
      return canvasRef.current.toDataURL();
    } catch (error) {
      console.error('Erreur génération code-barres:', error);
      return '';
    }
  };

  const renderEtiquette = (template: EtiquetteTemplate, data: EtiquetteData): string => {
    let html = template.templateHtml;
    
    // Remplacer les variables dans le template
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value || '');
    });

    // Générer le code-barres si nécessaire
    if (data.codeBarres && html.includes('{{codeBarres}}')) {
      const barcodeImage = generateBarcode(data.codeBarres);
      html = html.replace('{{codeBarres}}', `<img src="${barcodeImage}" alt="${data.codeBarres}" />`);
    }

    return `
      <style>${template.templateCss}</style>
      ${html}
    `;
  };

  const ajouterEtiquette = () => {
    const nouvelleEtiquette: EtiquetteData = {
      id: Date.now().toString(),
      titre: '',
      auteur: '',
      cote: '',
      codeBarres: generateRandomBarcode()
    };
    setEtiquettesData([...etiquettesData, nouvelleEtiquette]);
  };

  const generateRandomBarcode = (): string => {
    return Math.random().toString().substr(2, 12);
  };

  const importerDepuisSelection = async () => {
    // Simuler l'import depuis une sélection de livres
    const livresSelectionnes = [
      {
        id: '1',
        titre: 'Introduction à l\'algorithmique',
        auteur: 'Thomas H. Cormen',
        cote: 'INFO.004.1',
        isbn: '9782100545261',
        codeBarres: '123456789012'
      },
      {
        id: '2',
        titre: 'Mathématiques pour l\'informatique',
        auteur: 'Jean-Paul Delahaye',
        cote: 'MATH.510.2',
        isbn: '9782701149851',
        codeBarres: '123456789013'
      }
    ];

    setEtiquettesData(livresSelectionnes);
  };

  const genererPDF = () => {
    if (!selectedTemplate || etiquettesData.length === 0) return;

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const etiquettesHtml = etiquettesData.map(data => 
      renderEtiquette(selectedTemplate, data)
    ).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Étiquettes - ${selectedTemplate.nom}</title>
          <style>
            body { margin: 0; padding: 10mm; }
            .etiquettes-container { 
              display: flex; 
              flex-wrap: wrap; 
              gap: 2mm; 
            }
            @media print {
              body { margin: 0; }
              .etiquettes-container { gap: 0; }
            }
          </style>
        </head>
        <body>
          <div class="etiquettes-container">
            ${etiquettesHtml}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Générateur d'étiquettes</h1>
          <p className="text-muted-foreground">
            Créez et imprimez des étiquettes pour vos livres et cartes lecteurs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template">Template d'étiquette</Label>
              <Select onValueChange={(value) => {
                const template = templates.find(t => t.id === value);
                setSelectedTemplate(template || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Format:</span>
                  <Badge variant="secondary">{selectedTemplate.format}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dimensions:</span>
                  <span>{selectedTemplate.largeurMm} × {selectedTemplate.hauteurMm} mm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Type:</span>
                  <Badge>{selectedTemplate.type}</Badge>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={ajouterEtiquette} className="flex-1">
                Ajouter
              </Button>
              <Button onClick={importerDepuisSelection} variant="outline" className="flex-1">
                Importer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des étiquettes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Étiquettes ({etiquettesData.length})</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {etiquettesData.map((etiquette, index) => (
                <div key={etiquette.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Étiquette #{index + 1}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setEtiquettesData(etiquettesData.filter(e => e.id !== etiquette.id));
                      }}
                    >
                      ×
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Titre"
                      value={etiquette.titre || ''}
                      onChange={(e) => {
                        const updated = etiquettesData.map(et => 
                          et.id === etiquette.id ? {...et, titre: e.target.value} : et
                        );
                        setEtiquettesData(updated);
                      }}
                    />
                    <Input
                      placeholder="Auteur"
                      value={etiquette.auteur || ''}
                      onChange={(e) => {
                        const updated = etiquettesData.map(et => 
                          et.id === etiquette.id ? {...et, auteur: e.target.value} : et
                        );
                        setEtiquettesData(updated);
                      }}
                    />
                    <Input
                      placeholder="Cote"
                      value={etiquette.cote || ''}
                      onChange={(e) => {
                        const updated = etiquettesData.map(et => 
                          et.id === etiquette.id ? {...et, cote: e.target.value} : et
                        );
                        setEtiquettesData(updated);
                      }}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Code-barres"
                        value={etiquette.codeBarres || ''}
                        onChange={(e) => {
                          const updated = etiquettesData.map(et => 
                            et.id === etiquette.id ? {...et, codeBarres: e.target.value} : et
                          );
                          setEtiquettesData(updated);
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const updated = etiquettesData.map(et => 
                            et.id === etiquette.id ? {...et, codeBarres: generateRandomBarcode()} : et
                          );
                          setEtiquettesData(updated);
                        }}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {etiquettesData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune étiquette configurée
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Aperçu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Aperçu</span>
              <div className="flex gap-2">
                <Button 
                  onClick={genererPDF}
                  disabled={!selectedTemplate || etiquettesData.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTemplate && etiquettesData.length > 0 ? (
              <div className="space-y-4">
                {etiquettesData.slice(0, 3).map((etiquette, index) => (
                  <div 
                    key={etiquette.id}
                    className="border rounded p-2"
                    dangerouslySetInnerHTML={{
                      __html: renderEtiquette(selectedTemplate, etiquette)
                    }}
                  />
                ))}
                {etiquettesData.length > 3 && (
                  <div className="text-center text-sm text-muted-foreground">
                    ... et {etiquettesData.length - 3} autres étiquettes
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Sélectionnez un template et ajoutez des étiquettes pour voir l'aperçu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Canvas caché pour génération des codes-barres */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default GenerateurEtiquettes;