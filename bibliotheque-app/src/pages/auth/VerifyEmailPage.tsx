import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { authApi } from "@/api/auth.api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-[#d8f3dc] via-white to-[#f3f8f4] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 size={48} className="mx-auto animate-spin text-[#1b4332]" />
            <p className="text-gray-600">Vérification en cours...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">Email vérifié !</h2>
            <p className="text-gray-600">Votre adresse email a été confirmée avec succès.</p>
            <button onClick={() => navigate("/login")}
              className="w-full rounded-lg bg-[#1b4332] py-3 font-semibold text-white transition hover:bg-[#163828] focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:ring-offset-2">
              Se connecter
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={48} className="mx-auto text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Lien invalide</h2>
            <p className="text-gray-600">Ce lien est invalide ou a expiré.</p>
            <button onClick={() => navigate("/login")}
              className="w-full rounded-lg bg-gray-100 py-3 font-semibold text-gray-700 hover:bg-gray-200">
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}
