import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  BookOpen, Users, TrendingUp, AlertTriangle, 
  Calendar, DollarSign, Activity, Settings 
} from 'lucide-react';

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'calendar';
  title: string;
  size: 'small' | 'medium' | 'large';
  data?: any;
  config?: any;
}

interface DashboardStats {
  empruntsAujourdhui: number;
  retoursAujourdhui: number;
  empruntsEnRetard: number;
  reservationsEnAttente: number;
  nouveauxLecteurs: number;
  amendesImpayees: number;
  livresPopulaires: Array<{titre: string, nbEmprunts: number}>;
  evolutionEmprunts: Array<{date: string, emprunts: number, retours: number}>;
}

const DashboardConfigurable: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    { id: 'emprunts-today', type: 'metric', title: 'Emprunts aujourd\'hui', size: 'small' },
    { id: 'retours-today', type: 'metric', title: 'Retours aujourd\'hui', size: 'small' },
    { id: 'emprunts-retard', type: 'metric', title: 'Emprunts en retard', size: 'small' },
    { id: 'reservations', type: 'metric', title: 'Réservations en attente', size: 'small' },
    { id: 'evolution-emprunts', type: 'chart', title: 'Évolution des emprunts', size: 'large' },
    { id: 'livres-populaires', type: 'chart', title: 'Livres populaires', size: 'medium' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/statistiques/dashboard');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricWidget: React.FC<{ widget: DashboardWidget; value: number; icon: React.ReactNode; color: string }> = 
    ({ widget, value, icon, color }) => (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{widget.title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          </div>
          <div className={`p-2 rounded-full ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ChartWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
    if (!stats) return null;

    const renderChart = () => {
      switch (widget.id) {
        case 'evolution-emprunts':
          return (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.evolutionEmprunts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="emprunts" stroke="#8884d8" name="Emprunts" />
                <Line type="monotone" dataKey="retours" stroke="#82ca9d" name="Retours" />
              </LineChart>
            </ResponsiveContainer>
          );
        
        case 'livres-populaires':
          return (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.livresPopulaires.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="titre" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="nbEmprunts" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          );
        
        default:
          return <div>Graphique non configuré</div>;
      }
    };

    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {widget.title}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>
    );
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!stats) return null;

    switch (widget.type) {
      case 'metric':
        const metricConfigs = {
          'emprunts-today': { 
            value: stats.empruntsAujourdhui, 
            icon: <BookOpen className="h-4 w-4" />, 
            color: 'bg-blue-100 text-blue-600' 
          },
          'retours-today': { 
            value: stats.retoursAujourdhui, 
            icon: <TrendingUp className="h-4 w-4" />, 
            color: 'bg-green-100 text-green-600' 
          },
          'emprunts-retard': { 
            value: stats.empruntsEnRetard, 
            icon: <AlertTriangle className="h-4 w-4" />, 
            color: 'bg-red-100 text-red-600' 
          },
          'reservations': { 
            value: stats.reservationsEnAttente, 
            icon: <Calendar className="h-4 w-4" />, 
            color: 'bg-yellow-100 text-yellow-600' 
          },
        };
        
        const config = metricConfigs[widget.id as keyof typeof metricConfigs];
        return config ? <MetricWidget widget={widget} {...config} /> : null;

      case 'chart':
        return <ChartWidget widget={widget} />;

      default:
        return (
          <Card>
            <CardContent className="p-6">
              <p>Widget {widget.type} non implémenté</p>
            </CardContent>
          </Card>
        );
    }
  };

  const getGridCols = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      default: return 'col-span-1';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de l'activité de la bibliothèque
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDashboardStats}>
            <Activity className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurer
          </Button>
        </div>
      </div>

      {stats && stats.empruntsEnRetard > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">
                {stats.empruntsEnRetard} emprunt(s) en retard nécessitent votre attention
              </span>
              <Button variant="link" className="text-red-600 p-0 h-auto">
                Voir les détails
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((widget) => (
          <div key={widget.id} className={getGridCols(widget.size)}>
            {renderWidget(widget)}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">Nouvel emprunt</p>
                <p className="text-sm text-muted-foreground">
                  "Introduction à l'algorithmique" emprunté par Jean Dupont
                </p>
              </div>
              <Badge variant="secondary">Il y a 5 min</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">Retour effectué</p>
                <p className="text-sm text-muted-foreground">
                  "Mathématiques appliquées" retourné par Marie Martin
                </p>
              </div>
              <Badge variant="secondary">Il y a 12 min</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="font-medium">Nouveau lecteur</p>
                <p className="text-sm text-muted-foreground">
                  Pierre Durand s'est inscrit à la bibliothèque
                </p>
              </div>
              <Badge variant="secondary">Il y a 1h</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardConfigurable;