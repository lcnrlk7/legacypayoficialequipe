"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileCheck, 
  Upload, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  Camera,
  CreditCard,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface KYCDocument {
  id: string;
  document_type: string;
  file_url: string;
  file_name?: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  viewUrl?: string;
}

const documentTypes = [
  {
    type: "document_front",
    title: "Documento de Identidade (Frente)",
    description: "RG, CNH ou Passaporte - foto da frente",
    icon: CreditCard,
  },
  {
    type: "document_back",
    title: "Documento de Identidade (Verso)",
    description: "RG, CNH ou Passaporte - foto do verso",
    icon: CreditCard,
  },
  {
    type: "address_proof",
    title: "Comprovante de Endereço",
    description: "Conta de luz, água ou telefone (últimos 3 meses)",
    icon: Home,
  },
  {
    type: "selfie",
    title: "Selfie com Documento",
    description: "Foto sua segurando o documento de identidade",
    icon: Camera,
  },
];

export default function KYCPage() {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
    try {
      // Get session to check user
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      if (!sessionData.user) {
        setLoading(false);
        return;
      }

      // Get KYC documents and profile
      const [docsRes, profileRes] = await Promise.all([
        fetch('/api/kyc/documents'),
        fetch('/api/user/profile')
      ]);
      
      const docsData = await docsRes.json();
      const profileData = await profileRes.json();

      setDocuments(docsData.documents || []);
      setKycStatus(profileData.profile?.kyc_status || "not_submitted");
    } catch (error) {
      console.error('Error loading KYC data:', error);
    }
    setLoading(false);
  };

  const getDocumentStatus = (type: string) => {
    const doc = documents.find(d => d.document_type === type);
    return doc ? doc.status : "not_submitted";
  };

  const getDocumentInfo = (type: string) => {
    return documents.find(d => d.document_type === type);
  };

  const handleUpload = async (type: string, file: File) => {
    setUploading(type);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', type);

      const response = await fetch('/api/kyc/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Erro ao enviar documento');
        return;
      }

      // Recarregar dados após upload bem sucedido
      loadKYCData();
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar documento. Tente novamente.');
    } finally {
      setUploading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      case "pending":
        return "Em análise";
      default:
        return "Não enviado";
    }
  };

  const getOverallStatusBadge = () => {
    switch (kycStatus) {
      case "approved":
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Verificado</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-500">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Rejeitado</span>
          </div>
        );
      case "submitted":
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-500">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Em Análise</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Pendente</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Se KYC ja esta aprovado, mostrar apenas mensagem de sucesso
  if (kycStatus === "approved") {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Verificação KYC
            </h1>
            <p className="text-muted-foreground mt-1">
              Sua conta está totalmente verificada
            </p>
          </div>
          {getOverallStatusBadge()}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-green-500/20">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Verificação Concluída!
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Sua identidade foi verificada com sucesso. Você tem acesso completo 
                    a todas as funcionalidades da LegacyPay, incluindo saques e transferências.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Verificação KYC
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete sua verificação para desbloquear todos os recursos
          </p>
        </div>
        {getOverallStatusBadge()}
      </div>

      {/* Info Card */}
      {kycStatus !== "approved" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <FileCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Por que preciso verificar minha identidade?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    A verificação KYC é necessária para garantir a segurança da plataforma 
                    e permitir saques. Após a aprovação, você terá acesso completo a todas 
                    as funcionalidades.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Document Cards */}
      <div className="grid gap-6">
        {documentTypes.map((docType, index) => {
          const status = getDocumentStatus(docType.type);
          const docInfo = getDocumentInfo(docType.type);
          const isUploading = uploading === docType.type;

          return (
            <motion.div
              key={docType.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={status === "approved" ? "border-green-500/20" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        status === "approved" ? "bg-green-500/20" : "bg-muted"
                      }`}>
                        <docType.icon className={`w-6 h-6 ${
                          status === "approved" ? "text-green-500" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {docType.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1">
                          {docType.description}
                        </p>
                        
                        {docInfo?.rejection_reason && (
                          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-red-500 text-sm">
                              <strong>Motivo da rejeição:</strong> {docInfo.rejection_reason}
                            </p>
                          </div>
                        )}

                        {/* Preview da imagem enviada */}
                        {docInfo && docInfo.viewUrl && (
                          <div className="mt-3">
                            <a 
                              href={docInfo.viewUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img 
                                src={docInfo.viewUrl} 
                                alt={docType.title}
                                className="max-w-[200px] max-h-[150px] rounded-lg border border-border object-cover hover:opacity-80 transition-opacity"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </a>
                            <p className="text-xs text-muted-foreground mt-1">
                              Clique para ver em tamanho completo
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className={`text-sm font-medium ${
                          status === "approved" ? "text-green-500" :
                          status === "rejected" ? "text-red-500" :
                          status === "pending" ? "text-yellow-500" :
                          "text-muted-foreground"
                        }`}>
                          {getStatusText(status)}
                        </span>
                      </div>

                      {(status === "not_submitted" || status === "rejected") && (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(docType.type, file);
                            }}
                            disabled={isUploading}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            asChild
                          >
                            <span>
                              {isUploading ? (
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Enviar
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dúvidas frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground">Quais documentos são aceitos?</h4>
            <p className="text-muted-foreground text-sm mt-1">
              RG, CNH, Passaporte, Conta de luz, água, telefone ou internet.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground">Quanto tempo leva a análise?</h4>
            <p className="text-muted-foreground text-sm mt-1">
              A análise é feita em até 24 horas úteis após o envio de todos os documentos.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground">O que acontece se meu documento for rejeitado?</h4>
            <p className="text-muted-foreground text-sm mt-1">
              Você receberá o motivo da rejeição e poderá enviar novamente um documento válido.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
