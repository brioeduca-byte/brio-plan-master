import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Upload, BookOpen, Calculator, PenTool, Scroll, Globe, Microscope, CheckCircle } from 'lucide-react';

// File upload hook
export function useFileUpload() {
  return async (filename: string, file: File) => {
    const res = await fetch('https://brio-site.vercel.app/api/storage/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    const { uploadUrl } = await res.json();
    const gcsRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!gcsRes.ok) {
      throw new Error(`Falhou: ${gcsRes.statusText}`);
    }
    return true;
  };
}

// Types for the Slack API integration
interface FeedbackRequest {
  message: string;
}

interface SlackApiResponse {
  success: boolean;
  error?: string;
}

const SLACK_FEEDBACK_ENDPOINT = import.meta.env.VITE_SLACK_FEEDBACK_ENDPOINT || "https://brio-site.vercel.app/api/slack/send-message"
const GCS_BUCKET_NAME = import.meta.env.VITE_GCS_BUCKET_NAME || "YOUR_BUCKET_NAME"

const sendFormToSlack = async (
  formData: BrioFormData,
  disciplina: string
): Promise<SlackApiResponse> => {
  try {
    /* ---------- keep the original message structure ---------- */
    const message =
      `🎯 # Formulário de Planejamento de Conteúdo!\n\n` +
      `👤 **Nome:** ${formData.nome}\n\n` +
      `📚 **Disciplina:** ${disciplina}\n\n` +
      `📅 **Semana 1:**\n` +
      `   • Conteúdos: ${formData.semana1.conteudos}\n` +
      `   • Observações: ${formData.semana1.obs || 'Nenhuma'}\n` +
      `   • Arquivo: ${formData.semana1.upload ? formData.semana1.upload.name : 'Nenhum'}\n` +
      `   • Link: ${formData.semana1.fileUrl ? `[Download](${formData.semana1.fileUrl})` : 'N/A'}\n\n` +
      `📅 **Semana 2:**\n` +
      `   • Conteúdos: ${formData.semana2.conteudos}\n` +
      `   • Observações: ${formData.semana2.obs || 'Nenhuma'}\n` +
      `   • Arquivo: ${formData.semana2.upload ? formData.semana2.upload.name : 'Nenhum'}\n` +
      `   • Link: ${formData.semana2.fileUrl ? `[Download](${formData.semana2.fileUrl})` : 'N/A'}\n\n` +
      `📅 **Semana 3:**\n` +
      `   • Conteúdos: ${formData.semana3.conteudos}\n` +
      `   • Observações: ${formData.semana3.obs || 'Nenhuma'}\n` +
      `   • Arquivo: ${formData.semana3.upload ? formData.semana3.upload.name : 'Nenhum'}\n` +
      `   • Link: ${formData.semana3.fileUrl ? `[Download](${formData.semana3.fileUrl})` : 'N/A'}\n\n` +
      `📅 **Semana 4:**\n` +
      `   • Conteúdos: ${formData.semana4.conteudos}\n` +
      `   • Observações: ${formData.semana4.obs || 'Nenhuma'}\n` +
      `   • Arquivo: ${formData.semana4.upload ? formData.semana4.upload.name : 'Nenhum'}\n` +
      `   • Link: ${formData.semana4.fileUrl ? `[Download](${formData.semana4.fileUrl})` : 'N/A'}\n\n` +
      `📝 **Observações Gerais:** ${formData.observacoes_gerais || 'Nenhuma'}\n\n` +
      `🚀 **Status:** Formulário de planejamento completo enviado com sucesso!`;

    const payload: FeedbackRequest = { message };

    /* ---------- simple POST, no pre-flight workarounds ---------- */
    const response = await fetch(SLACK_FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result: SlackApiResponse = await response.json();

    if (!response.ok) {
      console.error('API Error:', response.status, result);
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return result;
  } catch (error) {
    console.error('Network or parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão desconhecido',
    };
  }
};


type Discipline = 'matematica' | 'portugues' | 'historia' | 'geografia' | 'ciencias';

interface WeekData {
  conteudos: string;
  upload?: File;
  obs: string;
  fileUrl?: string;
}

interface BrioFormData {
  nome: string;
  disciplina: Discipline | '';
  semana1: WeekData;
  semana2: WeekData;
  semana3: WeekData;
  semana4: WeekData;
  observacoes_gerais: string;
}

const disciplines = [
  { id: 'matematica' as const, label: '➗ Matemática', icon: Calculator },
  { id: 'portugues' as const, label: '✍️ Português', icon: PenTool },
  { id: 'historia' as const, label: '📜 História', icon: Scroll },
  { id: 'geografia' as const, label: '🌍 Geografia', icon: Globe },
  { id: 'ciencias' as const, label: '🔬 Ciências', icon: Microscope },
];

const STEPS = ['inicio', 'nome', 'disciplina', 'semana1', 'semana2', 'semana3', 'semana4', 'observacoes', 'final'] as const;
type Step = typeof STEPS[number];

const BrioForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('inicio');
  const [formData, setFormData] = useState<BrioFormData>({
    nome: '',
    disciplina: '',
    semana1: { conteudos: '', obs: '' },
    semana2: { conteudos: '', obs: '' },
    semana3: { conteudos: '', obs: '' },
    semana4: { conteudos: '', obs: '' },
    observacoes_gerais: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [isUploading, setIsUploading] = useState(false);
  
  // Initialize the file upload hook
  const uploadFileToGCS = useFileUpload();

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const updateFormData = useCallback((updates: Partial<BrioFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateWeekData = useCallback((week: 'semana1' | 'semana2' | 'semana3' | 'semana4', data: Partial<WeekData>) => {
    setFormData(prev => ({
      ...prev,
      [week]: { ...prev[week], ...data }
    }));
  }, []);

  const nextStep = () => {
    const nextIndex = Math.min(currentStepIndex + 1, STEPS.length - 1);
    setCurrentStep(STEPS[nextIndex]);
  };

  const prevStep = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(STEPS[prevIndex]);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'nome':
        return formData.nome.trim() !== '';
      case 'disciplina':
        return formData.disciplina !== '';
      case 'semana1':
        return formData.semana1.conteudos.trim() !== '';
      case 'semana2':
        return formData.semana2.conteudos.trim() !== '';
      case 'semana3':
        return formData.semana3.conteudos.trim() !== '';
      case 'semana4':
        return formData.semana4.conteudos.trim() !== '';
      default:
        return true;
    }
  };

  const handleFormSubmission = async () => {
    if (!formData.disciplina) {
      setSubmitError('Disciplina não selecionada');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError('');

    try {
      // Upload all files first
      setIsUploading(true);
      const uploadPromises: Promise<void>[] = [];
      
      // Upload files for each week
      ['semana1', 'semana2', 'semana3', 'semana4'].forEach((week) => {
        const weekKey = week as keyof Pick<BrioFormData, 'semana1' | 'semana2' | 'semana3' | 'semana4'>;
        const weekData = formData[weekKey];
        
        if (weekData.upload) {
          const uploadPromise = uploadFile(weekKey, weekData.upload);
          uploadPromises.push(uploadPromise);
        }
      });

      // Wait for all uploads to complete
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      setIsUploading(false);

      // Now send the form data to Slack
      const result = await sendFormToSlack(formData, formData.disciplina);
      
      if (result.success) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
        setSubmitError(result.error || 'Erro desconhecido ao enviar formulário');
      }
    } catch (error) {
      setIsUploading(false);
      setSubmitStatus('error');
      setSubmitError(error instanceof Error ? error.message : 'Erro ao enviar formulário');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadFile = async (week: string, file: File) => {
    try {
      const filename = `${week}_${Date.now()}_${file.name}`;
      
      // Update upload progress
      setUploadProgress(prev => ({ ...prev, [week]: 0 }));
      
      await uploadFileToGCS(filename, file);
      
      // Generate the file URL using the configured bucket name
      const fileUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filename}`;
      
      // Update the form data with the file URL
      updateWeekData(week as 'semana1' | 'semana2' | 'semana3' | 'semana4', { fileUrl });
      
      // Mark upload as complete
      setUploadProgress(prev => ({ ...prev, [week]: 100 }));
      
    } catch (error) {
      console.error(`Error uploading file for ${week}:`, error);
      setUploadProgress(prev => ({ ...prev, [week]: -1 })); // -1 indicates error
      throw error;
    }
  };

  const FloatingParticles = () => (
    <div className="particles">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 3 + 4}s`,
          }}
        />
      ))}
    </div>
  );

  const handleFileUpload = (week: 'semana1' | 'semana2' | 'semana3' | 'semana4', file: File | undefined) => {
    updateWeekData(week, { upload: file });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'inicio':
        return (
          <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center p-4">
            <FloatingParticles />
            <Card className="w-full max-w-2xl glass animate-fade-in">
              <CardHeader className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center glow-cyan">
                  <BookOpen className="w-8 h-8 text-accent-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
                    📚 Planejamento de Conteúdo
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Olá, professor(a)! Vamos planejar juntos os conteúdos das próximas quatro semanas 
                    para que seus alunos tenham clareza do que estudar e mais autonomia para aprender. 
                    Esse é o primeiro passo de uma parceria que vai potencializar o aprendizado e 
                    reduzir a sobrecarga em sala de aula.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <Button
                  onClick={nextStep}
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 glow-cyan"
                >
                  Começar Planejamento
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'nome':
        return (
          <div className="min-h-screen bg-gradient-hero relative p-4">
            <FloatingParticles />
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Progress value={progress} className="w-full mb-4" />
                <h2 className="text-3xl font-heading font-bold text-center text-foreground mb-2">
                  Qual é o seu nome?
                </h2>
                <p className="text-center text-muted-foreground">
                  Como devemos te chamar?
                </p>
              </div>

              <Card className="glass animate-fade-in">
                <CardContent className="p-8">
                  <div>
                    <Label htmlFor="nome" className="text-lg font-medium text-foreground mb-3 block">
                      Nome completo *
                    </Label>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Digite seu nome completo..."
                      value={formData.nome}
                      onChange={(e) => updateFormData({ nome: e.target.value })}
                      className="text-base h-12"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Voltar
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={canProceed() ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                >
                  Continuar
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'disciplina':
        return (
          <div className="min-h-screen bg-gradient-hero relative p-4">
            <FloatingParticles />
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Progress value={progress} className="w-full mb-4" />
                <h2 className="text-3xl font-heading font-bold text-center text-foreground mb-2">
                  Escolha sua disciplina
                </h2>
                <p className="text-center text-muted-foreground">
                  Caso ministre mais de uma, preencha um formulário para cada.
                </p>
              </div>

              <Card className="glass animate-fade-in">
                <CardContent className="p-8">
                  <RadioGroup
                    value={formData.disciplina}
                    onValueChange={(value) => updateFormData({ disciplina: value as Discipline })}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {disciplines.map((discipline) => {
                      const Icon = discipline.icon;
                      return (
                        <Label
                          key={discipline.id}
                          className={`relative flex items-center space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                            formData.disciplina === discipline.id
                              ? 'border-accent bg-accent/10 glow-cyan'
                              : 'border-border hover:border-accent/50'
                          }`}
                        >
                          <RadioGroupItem value={discipline.id} className="sr-only" />
                          <span className="text-lg font-medium text-foreground">
                            {discipline.label}
                          </span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Voltar
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={canProceed() ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                >
                  Continuar
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'semana1':
      case 'semana2':
      case 'semana3':
      case 'semana4':
        const weekNumber = currentStep.replace('semana', '');
        const weekKey = currentStep as 'semana1' | 'semana2' | 'semana3' | 'semana4';
        const weekData = formData[weekKey];

        return (
          <div className="min-h-screen bg-gradient-hero relative p-4">
            <FloatingParticles />
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Progress value={progress} className="w-full mb-4" />
                <h2 className="text-3xl font-heading font-bold text-center text-foreground mb-2">
                  Semana {weekNumber}
                </h2>
                <p className="text-center text-muted-foreground">
                  Planeje os conteúdos desta semana
                </p>
              </div>

              <Card className="glass animate-fade-in">
                <CardContent className="p-8 space-y-6">
                  <div>
                    <Label htmlFor={`semana${weekNumber}_conteudos`} className="text-lg font-medium text-foreground mb-3 block">
                      Quais conteúdos você pretende trabalhar nesta semana? *
                    </Label>
                    <Textarea
                      id={`semana${weekNumber}_conteudos`}
                      placeholder="Descreva os conteúdos que serão abordados..."
                      value={weekData.conteudos}
                      onChange={(e) => updateWeekData(weekKey, { conteudos: e.target.value })}
                      className="min-h-[120px] text-base"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`semana${weekNumber}_upload`} className="text-lg font-medium text-foreground mb-3 block">
                      Adicionar foto do livro ou material de apoio (opcional)
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-accent/50 transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <Input
                        id={`semana${weekNumber}_upload`}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileUpload(weekKey, e.target.files?.[0])}
                        className="hidden"
                      />
                      <Label
                        htmlFor={`semana${weekNumber}_upload`}
                        className="text-sm text-muted-foreground cursor-pointer hover:text-accent transition-colors"
                      >
                        Clique para selecionar um arquivo ou arraste aqui
                        <br />
                        <span className="text-xs">JPG, PNG ou PDF - Máximo 10MB</span>
                      </Label>
                      {weekData.upload && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-accent">
                            Arquivo selecionado: {weekData.upload.name}
                          </p>
                          {uploadProgress[weekKey] === 0 && (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                              <span className="text-xs text-muted-foreground">Fazendo upload...</span>
                            </div>
                          )}
                          {uploadProgress[weekKey] === 100 && weekData.fileUrl && (
                            <div className="text-xs text-green-600">
                              ✅ Upload concluído
                            </div>
                          )}
                          {uploadProgress[weekKey] === -1 && (
                            <div className="text-xs text-red-600">
                              ❌ Erro no upload
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`semana${weekNumber}_obs`} className="text-lg font-medium text-foreground mb-3 block">
                      Observações para esta semana (opcional)
                    </Label>
                    <Textarea
                      id={`semana${weekNumber}_obs`}
                      placeholder="Alguma observação específica sobre esta semana?"
                      value={weekData.obs}
                      onChange={(e) => updateWeekData(weekKey, { obs: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Voltar
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={canProceed() ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                >
                  Continuar
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'observacoes':
        return (
          <div className="min-h-screen bg-gradient-hero relative p-4">
            <FloatingParticles />
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Progress value={progress} className="w-full mb-4" />
                <h2 className="text-3xl font-heading font-bold text-center text-foreground mb-2">
                  Observações Gerais
                </h2>
                <p className="text-center text-muted-foreground">
                  Alguma informação adicional sobre o planejamento?
                </p>
              </div>

              <Card className="glass animate-fade-in">
                <CardContent className="p-8">
                  <div>
                    <Label htmlFor="observacoes_gerais" className="text-lg font-medium text-foreground mb-3 block">
                      Observações gerais do planejamento (opcional)
                    </Label>
                    <Textarea
                      id="observacoes_gerais"
                      placeholder="Compartilhe qualquer informação adicional que possa ajudar no planejamento..."
                      value={formData.observacoes_gerais}
                      onChange={(e) => updateFormData({ observacoes_gerais: e.target.value })}
                      className="min-h-[150px] text-base"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Voltar
                </Button>
                <Button
                  onClick={() => {
                    setSubmitStatus('idle');
                    setSubmitError('');
                    nextStep();
                  }}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Finalizar Planejamento
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'final':
        return (
          <div className="min-h-screen bg-gradient-success relative flex items-center justify-center p-4">
            <FloatingParticles />
            <Card className="w-full max-w-2xl glass animate-fade-in">
              <CardHeader className="text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-success rounded-full flex items-center justify-center glow-cyan">
                  <CheckCircle className="w-10 h-10 text-success-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
                    ✅ Planejamento recebido!
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Obrigado(a) por dar este primeiro passo. Este é o início da nossa parceria: 
                    juntos, vamos potencializar o aprendizado dos alunos, promover mais autonomia 
                    de forma divertida e reduzir a sobrecarga dos professores.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {/* Submission Status */}
                {submitStatus === 'idle' && (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Clique no botão abaixo para enviar seu planejamento para nossa equipe.
                    </p>
                    <Button
                      onClick={handleFormSubmission}
                      disabled={isSubmitting || isUploading}
                      size="lg"
                      className="bg-accent text-accent-foreground hover:bg-accent/90 glow-cyan"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Fazendo upload dos arquivos...
                        </>
                      ) : isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enviando...
                        </>
                      ) : (
                        'Enviar Planejamento'
                      )}
                    </Button>
                  </div>
                )}

                {submitStatus === 'success' && (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-600">
                      ✅ Planejamento enviado com sucesso!
                    </h3>
                    <p className="text-muted-foreground">
                      Sua equipe recebeu o planejamento e entrará em contato em breve.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">⚠️</span>
                    </div>
                    <h3 className="text-xl font-semibold text-red-600">
                      ❌ Erro ao enviar planejamento
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {submitError}
                    </p>
                    <Button
                      onClick={handleFormSubmission}
                      disabled={isSubmitting}
                      size="lg"
                      className="bg-red-500 text-white hover:bg-red-600"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                )}

                {/* Reset Button - only show after successful submission or if user wants to start over */}
                {(submitStatus === 'success' || submitStatus === 'idle') && (
                  <Button
                    onClick={() => {
                      setCurrentStep('inicio');
                      setFormData({
                        nome: '',
                        disciplina: '',
                        semana1: { conteudos: '', obs: '' },
                        semana2: { conteudos: '', obs: '' },
                        semana3: { conteudos: '', obs: '' },
                        semana4: { conteudos: '', obs: '' },
                        observacoes_gerais: '',
                      });
                      setSubmitStatus('idle');
                      setSubmitError('');
                      setUploadProgress({});
                    }}
                    variant="outline"
                    size="lg"
                    className="mt-4"
                  >
                    Criar Novo Planejamento
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="font-sans">{renderStep()}</div>;
};

export default BrioForm;