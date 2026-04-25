"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Webhook,
  Send,
  Plus,
  Trash2,
  Image as ImageIcon,
  Palette,
  Type,
  FileText,
  User,
  Link as LinkIcon,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface DiscordEmbed {
  title: string;
  description: string;
  color: string;
  url: string;
  thumbnail: string;
  image: string;
  authorName: string;
  authorIcon: string;
  authorUrl: string;
  footerText: string;
  footerIcon: string;
  timestamp: boolean;
  fields: EmbedField[];
}

const defaultEmbed: DiscordEmbed = {
  title: "",
  description: "",
  color: "#FF6B00",
  url: "",
  thumbnail: "",
  image: "",
  authorName: "",
  authorIcon: "",
  authorUrl: "",
  footerText: "",
  footerIcon: "",
  timestamp: false,
  fields: [],
};

const presetColors = [
  { name: "Laranja", value: "#FF6B00" },
  { name: "Verde", value: "#00FF88" },
  { name: "Azul", value: "#5865F2" },
  { name: "Vermelho", value: "#ED4245" },
  { name: "Amarelo", value: "#FEE75C" },
  { name: "Rosa", value: "#EB459E" },
  { name: "Roxo", value: "#9B59B6" },
  { name: "Ciano", value: "#00D4FF" },
];

export default function WebhooksPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [embed, setEmbed] = useState<DiscordEmbed>(defaultEmbed);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const addField = () => {
    setEmbed({
      ...embed,
      fields: [...embed.fields, { name: "", value: "", inline: false }],
    });
  };

  const removeField = (index: number) => {
    setEmbed({
      ...embed,
      fields: embed.fields.filter((_, i) => i !== index),
    });
  };

  const updateField = (index: number, key: keyof EmbedField, value: string | boolean) => {
    const newFields = [...embed.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setEmbed({ ...embed, fields: newFields });
  };

  const hexToDecimal = (hex: string) => {
    return parseInt(hex.replace("#", ""), 16);
  };

  const sendWebhook = async () => {
    if (!webhookUrl) {
      setResult({ success: false, message: "Insira a URL do webhook" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const embedData: Record<string, unknown> = {};

      if (embed.title) embedData.title = embed.title;
      if (embed.description) embedData.description = embed.description;
      if (embed.url) embedData.url = embed.url;
      if (embed.color) embedData.color = hexToDecimal(embed.color);
      if (embed.thumbnail) embedData.thumbnail = { url: embed.thumbnail };
      if (embed.image) embedData.image = { url: embed.image };
      if (embed.authorName) {
        embedData.author = {
          name: embed.authorName,
          icon_url: embed.authorIcon || undefined,
          url: embed.authorUrl || undefined,
        };
      }
      if (embed.footerText) {
        embedData.footer = {
          text: embed.footerText,
          icon_url: embed.footerIcon || undefined,
        };
      }
      if (embed.timestamp) {
        embedData.timestamp = new Date().toISOString();
      }
      if (embed.fields.length > 0) {
        embedData.fields = embed.fields
          .filter((f) => f.name && f.value)
          .map((f) => ({
            name: f.name,
            value: f.value,
            inline: f.inline,
          }));
      }

      const payload: Record<string, unknown> = {};
      if (content) payload.content = content;
      if (Object.keys(embedData).length > 0) payload.embeds = [embedData];

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 204) {
        setResult({ success: true, message: "Webhook enviado com sucesso!" });
      } else {
        const error = await response.text();
        setResult({ success: false, message: `Erro: ${error}` });
      }
    } catch (error) {
      setResult({ success: false, message: `Erro ao enviar: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const resetEmbed = () => {
    setEmbed(defaultEmbed);
    setContent("");
    setResult(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Webhooks Discord</h1>
          <p className="text-muted-foreground">
            Envie mensagens personalizadas para servidores Discord
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? "Ocultar" : "Mostrar"} Preview
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-6">
          {/* Webhook URL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Webhook className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">URL do Webhook</h2>
                <p className="text-xs text-muted-foreground">
                  Cole a URL do webhook do Discord
                </p>
              </div>
            </div>
            <Input
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="bg-secondary border-border"
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Type className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Mensagem (opcional)</h2>
                <p className="text-xs text-muted-foreground">
                  Texto fora da embed
                </p>
              </div>
            </div>
            <Textarea
              placeholder="Mensagem de texto simples..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-secondary border-border resize-none"
              rows={2}
            />
          </motion.div>

          {/* Embed Editor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Embed</h2>
                <p className="text-xs text-muted-foreground">
                  Personalize a embed do Discord
                </p>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Titulo</Label>
                <Input
                  placeholder="Titulo da embed"
                  value={embed.title}
                  onChange={(e) => setEmbed({ ...embed, title: e.target.value })}
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Descricao</Label>
                <Textarea
                  placeholder="Descricao da embed..."
                  value={embed.description}
                  onChange={(e) => setEmbed({ ...embed, description: e.target.value })}
                  className="bg-secondary border-border mt-1 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">URL (link no titulo)</Label>
                <Input
                  placeholder="https://..."
                  value={embed.url}
                  onChange={(e) => setEmbed({ ...embed, url: e.target.value })}
                  className="bg-secondary border-border mt-1"
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Cor da Embed
              </Label>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setEmbed({ ...embed, color: color.value })}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      embed.color === color.value
                        ? "ring-2 ring-white ring-offset-2 ring-offset-card scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
                <Input
                  type="color"
                  value={embed.color}
                  onChange={(e) => setEmbed({ ...embed, color: e.target.value })}
                  className="w-10 h-8 p-0 border-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Autor
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Nome do autor"
                  value={embed.authorName}
                  onChange={(e) => setEmbed({ ...embed, authorName: e.target.value })}
                  className="bg-secondary border-border"
                />
                <Input
                  placeholder="URL do icone"
                  value={embed.authorIcon}
                  onChange={(e) => setEmbed({ ...embed, authorIcon: e.target.value })}
                  className="bg-secondary border-border"
                />
                <Input
                  placeholder="URL do autor"
                  value={embed.authorUrl}
                  onChange={(e) => setEmbed({ ...embed, authorUrl: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Imagens
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder="URL da thumbnail (pequena)"
                  value={embed.thumbnail}
                  onChange={(e) => setEmbed({ ...embed, thumbnail: e.target.value })}
                  className="bg-secondary border-border"
                />
                <Input
                  placeholder="URL da imagem (grande)"
                  value={embed.image}
                  onChange={(e) => setEmbed({ ...embed, image: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm">Campos</Label>
                <Button variant="outline" size="sm" onClick={addField} className="gap-1">
                  <Plus className="w-3 h-3" />
                  Adicionar
                </Button>
              </div>
              {embed.fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-secondary rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Nome do campo"
                      value={field.name}
                      onChange={(e) => updateField(index, "name", e.target.value)}
                      className="bg-card border-border"
                    />
                    <Input
                      placeholder="Valor do campo"
                      value={field.value}
                      onChange={(e) => updateField(index, "value", e.target.value)}
                      className="bg-card border-border"
                    />
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={field.inline}
                        onChange={(e) => updateField(index, "inline", e.target.checked)}
                        className="rounded"
                      />
                      Inline
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Rodape
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder="Texto do rodape"
                  value={embed.footerText}
                  onChange={(e) => setEmbed({ ...embed, footerText: e.target.value })}
                  className="bg-secondary border-border"
                />
                <Input
                  placeholder="URL do icone do rodape"
                  value={embed.footerIcon}
                  onChange={(e) => setEmbed({ ...embed, footerIcon: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <input
                  type="checkbox"
                  checked={embed.timestamp}
                  onChange={(e) => setEmbed({ ...embed, timestamp: e.target.checked })}
                  className="rounded"
                />
                <Clock className="w-3 h-3" />
                Incluir timestamp
              </label>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={sendWebhook}
              disabled={loading || !webhookUrl}
              className="flex-1 bg-primary hover:bg-primary/90 gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar Webhook
            </Button>
            <Button variant="outline" onClick={resetEmbed}>
              Limpar
            </Button>
          </div>

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 p-4 rounded-xl ${
                result.success
                  ? "bg-green-500/10 text-green-500 border border-green-500/30"
                  : "bg-destructive/10 text-destructive border border-destructive/30"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              {result.message}
            </motion.div>
          )}
        </div>

        {/* Preview */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#313338] rounded-2xl p-6 h-fit sticky top-6"
          >
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview Discord
            </h3>

            {/* Discord Message Preview */}
            <div className="space-y-2">
              {content && (
                <p className="text-[#DBDEE1] text-sm">{content}</p>
              )}

              {(embed.title || embed.description || embed.image || embed.thumbnail) && (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    borderLeft: `4px solid ${embed.color}`,
                    backgroundColor: "#2B2D31",
                  }}
                >
                  <div className="p-4">
                    {/* Author */}
                    {embed.authorName && (
                      <div className="flex items-center gap-2 mb-2">
                        {embed.authorIcon && (
                          <img
                            src={embed.authorIcon}
                            alt=""
                            className="w-6 h-6 rounded-full"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        )}
                        <span className="text-xs text-white font-medium">
                          {embed.authorName}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        {embed.title && (
                          <h4
                            className={`font-semibold text-sm mb-1 ${
                              embed.url ? "text-[#00A8FC] hover:underline" : "text-white"
                            }`}
                          >
                            {embed.title}
                          </h4>
                        )}

                        {/* Description */}
                        {embed.description && (
                          <p className="text-[#DBDEE1] text-sm whitespace-pre-wrap">
                            {embed.description}
                          </p>
                        )}

                        {/* Fields */}
                        {embed.fields.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {embed.fields
                              .filter((f) => f.name && f.value)
                              .map((field, i) => (
                                <div
                                  key={i}
                                  className={field.inline ? "col-span-1" : "col-span-3"}
                                >
                                  <p className="text-xs font-semibold text-white">
                                    {field.name}
                                  </p>
                                  <p className="text-xs text-[#DBDEE1]">{field.value}</p>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Image */}
                        {embed.image && (
                          <img
                            src={embed.image}
                            alt=""
                            className="mt-3 rounded max-w-full max-h-[300px] object-contain"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        )}
                      </div>

                      {/* Thumbnail */}
                      {embed.thumbnail && (
                        <img
                          src={embed.thumbnail}
                          alt=""
                          className="w-20 h-20 rounded object-cover flex-shrink-0"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                    </div>

                    {/* Footer */}
                    {(embed.footerText || embed.timestamp) && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-[#949BA4]">
                        {embed.footerIcon && (
                          <img
                            src={embed.footerIcon}
                            alt=""
                            className="w-5 h-5 rounded-full"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        )}
                        {embed.footerText}
                        {embed.footerText && embed.timestamp && " • "}
                        {embed.timestamp && new Date().toLocaleString("pt-BR")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!content && !embed.title && !embed.description && (
                <p className="text-[#949BA4] text-sm text-center py-8">
                  Preencha os campos para ver o preview
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
