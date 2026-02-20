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
    const res = await fetch('https://www.brioeducacional.com.br/api/storage/upload', {
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

const SLACK_FEEDBACK_ENDPOINT = import.meta.env.VITE_SLACK_FEEDBACK_ENDPOINT || "https://www.brioeducacional.com.br/api/slack/send-message"
const GCS_BUCKET_NAME = import.meta.env.VITE_GCS_BUCKET_NAME || "midia.brioeduca.com"

const sendFormToSlack = async (
  formData: BrioFormData,
  disciplina: string
): Promise<SlackApiResponse> => {
  try {
    console.log('📧 Preparando mensagem para Slack...');
    console.log('Endpoint:', SLACK_FEEDBACK_ENDPOINT);
    
    /* ---------- keep the original message structure ---------- */
    const message =
      `🎯 # Formulário de Planejamento de Conteúdo!\n\n` +
      `👤 **Nome:** ${formData.nome}\n\n` +
      `🗓️ **Ano Letivo:** ${formData.anoLetivo}\n\n` +
      `🎓 **Ano Escolar:** ${formData.anoEscolar}\n\n` +
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

    console.log('📤 Enviando requisição...');
    
    /* ---------- simple POST, no pre-flight workarounds ---------- */
    const response = await fetch(SLACK_FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('📥 Resposta recebida:', response.status, response.statusText);

    const result: SlackApiResponse = await response.json();
    console.log('📋 Resultado:', result);

    if (!response.ok) {
      console.error('❌ API Error:', response.status, result);
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    console.log('✅ Mensagem enviada com sucesso para Slack');
    return result;
  } catch (error) {
    console.error('💥 Network or parsing error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
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

interface MonthPlan {
  mes: number;
  ano: number;
  semana1: WeekData;
  semana2: WeekData;
  semana3: WeekData;
  semana4: WeekData;
  observacoes_gerais: string;
}

interface BrioFormData {
  nome: string;
  anoLetivo: string;
  anoEscolar: string;
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

const STEPS = ['inicio', 'como-vai-funcionar', 'nome', 'disciplina', 'selecao-periodos', 'planejamento', 'final'] as const;
type Step = typeof STEPS[number];

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const YEARS = [2024, 2025, 2026].map(year => year.toString());

const BrioForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('inicio');
  const [formData, setFormData] = useState<BrioFormData>({
    nome: '',
    anoLetivo: new Date().getFullYear().toString(),
    anoEscolar: '',
    disciplina: '',
    semana1: { conteudos: '', obs: '' },
    semana2: { conteudos: '', obs: '' },
    semana3: { conteudos: '', obs: '' },
    semana4: { conteudos: '', obs: '' },
    observacoes_gerais: '',
  });

  // Multi-month planning state
  const [quantidadeMeses, setQuantidadeMeses] = useState<'1' | '2' | '3+'>('1');
  const [periodosEscolhidos, setPeriodosEscolhidos] = useState<{ mes: number; ano: number }[]>([{ mes: 8, ano: 2025 }]);
  const [planosMes, setPlanosMes] = useState<{ [key: string]: MonthPlan }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
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
        return formData.nome.trim() !== '' && formData.anoLetivo !== '' && formData.anoEscolar !== '';
      case 'disciplina':
        return formData.disciplina !== '';
      case 'selecao-periodos':
        return periodosEscolhidos.length > 0;
      case 'planejamento':
        // Check if all months have required content filled (use fallback if plan not yet initialized)
        return periodosEscolhidos.every(periodo => {
          const key = `${periodo.mes}-${periodo.ano}`;
          const plano = planosMes[key];
          if (!plano) return false;
          return (
            plano.semana1.conteudos.trim() !== '' &&
            plano.semana2.conteudos.trim() !== '' &&
            plano.semana3.conteudos.trim() !== '' &&
            plano.semana4.conteudos.trim() !== ''
          );
        });
      default:
        return true;
    }
  };

  const handleFormSubmission = async () => {
    console.log('=== INICIANDO ENVIO ===');
    console.log('Disciplina:', formData.disciplina);
    console.log('Períodos escolhidos:', periodosEscolhidos);
    console.log('Planos por mês:', planosMes);

    if (!formData.disciplina) {
      console.error('❌ Disciplina não selecionada');
      setSubmitError('Disciplina não selecionada');
      setSubmitStatus('error');
      return;
    }

    if (periodosEscolhidos.length === 0) {
      console.error('❌ Nenhum período selecionado');
      setSubmitError('Nenhum período selecionado');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError('');

    try {
      setIsUploading(true);
      console.log(`📤 Processando ${periodosEscolhidos.length} período(s)...`);

      // Process each month separately
      for (const periodo of periodosEscolhidos) {
        const key = `${periodo.mes}-${periodo.ano}`;
        const planoMes = planosMes[key];

        console.log(`\n--- Processando ${MONTHS[periodo.mes - 1]}/${periodo.ano} ---`);

        if (!planoMes) {
          console.warn(`⚠️ Plano não encontrado para ${key}`);
          continue;
        }

        // Upload files for this month
        const uploadPromises: Promise<void>[] = [];
        ['semana1', 'semana2', 'semana3', 'semana4'].forEach((week) => {
          const weekKey = week as keyof Pick<MonthPlan, 'semana1' | 'semana2' | 'semana3' | 'semana4'>;
          const weekData = planoMes[weekKey];

          if (weekData.upload) {
            console.log(`📎 Upload agendado: ${week} - ${weekData.upload.name}`);
            const uploadPromise = uploadFileForMonth(key, weekKey, weekData.upload);
            uploadPromises.push(uploadPromise);
          }
        });

        // Wait for uploads to complete for this month
        if (uploadPromises.length > 0) {
          console.log(`⏳ Aguardando ${uploadPromises.length} upload(s)...`);
          await Promise.all(uploadPromises);
          console.log('✅ Todos os uploads concluídos');
        }

        // Create form data with period injected
        const mesNome = MONTHS[periodo.mes - 1];
        const periodoTag = `[PERIODO=${mesNome}/${periodo.ano}]`;

        const formDataWithPeriod: BrioFormData = {
          nome: formData.nome,
          anoLetivo: formData.anoLetivo,
          anoEscolar: formData.anoEscolar,
          disciplina: formData.disciplina,
          semana1: {
            ...planoMes.semana1,
            obs: planoMes.semana1.obs ? `${periodoTag} ${planoMes.semana1.obs}` : planoMes.semana1.obs
          },
          semana2: {
            ...planoMes.semana2,
            obs: planoMes.semana2.obs ? `${periodoTag} ${planoMes.semana2.obs}` : planoMes.semana2.obs
          },
          semana3: {
            ...planoMes.semana3,
            obs: planoMes.semana3.obs ? `${periodoTag} ${planoMes.semana3.obs}` : planoMes.semana3.obs
          },
          semana4: {
            ...planoMes.semana4,
            obs: planoMes.semana4.obs ? `${periodoTag} ${planoMes.semana4.obs}` : planoMes.semana4.obs
          },
          observacoes_gerais: planoMes.observacoes_gerais
            ? `${periodoTag}\n${planoMes.observacoes_gerais}`
            : periodoTag
        };

        console.log('📨 Enviando para Slack...');
        console.log('Dados:', JSON.stringify(formDataWithPeriod, null, 2));

        // Send this month's data
        const result = await sendFormToSlack(formDataWithPeriod, formData.disciplina);

        if (!result.success) {
          console.error('❌ Erro no envio:', result.error);
          throw new Error(result.error || `Erro ao enviar planejamento de ${mesNome}/${periodo.ano}`);
        }

        console.log(`✅ ${mesNome}/${periodo.ano} enviado com sucesso!`);
      }

      setIsUploading(false);
      setSubmitStatus('success');
      console.log('🎉 Todos os períodos enviados com sucesso!');

    } catch (error) {
      setIsUploading(false);
      setSubmitStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar formulário';
      setSubmitError(errorMessage);
      console.error('💥 Erro geral:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    } finally {
      setIsSubmitting(false);
      console.log('=== FIM DO ENVIO ===\n');
    }
  };

  const uploadFile = async (week: string, file: File) => {
    try {
      const filename = `mapple-bear/${formData.nome.toLowerCase().replace(/\s+/g, '-')}/${week}_${Date.now()}_${file.name}`;

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

  const uploadFileForMonth = async (monthKey: string, week: string, file: File) => {
    try {
      const filename = `mapple-bear/${formData.nome.toLowerCase().replace(/\s+/g, '-')}/${monthKey}_${week}_${Date.now()}_${file.name}`;

      // Update upload progress
      const uploadKey = `${monthKey}_${week}`;
      setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));

      await uploadFileToGCS(filename, file);

      // Generate the file URL using the configured bucket name
      const fileUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filename}`;

      // Update the month plan with the file URL
      setPlanosMes(prev => ({
        ...prev,
        [monthKey]: {
          ...prev[monthKey],
          [week]: {
            ...prev[monthKey][week],
            fileUrl
          }
        }
      }));

      // Mark upload as complete
      setUploadProgress(prev => ({ ...prev, [uploadKey]: 100 }));

    } catch (error) {
      console.error(`Error uploading file for ${monthKey}_${week}:`, error);
      const uploadKey = `${monthKey}_${week}`;
      setUploadProgress(prev => ({ ...prev, [uploadKey]: -1 })); // -1 indicates error
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

  const handleFileUploadForMonth = (monthKey: string, week: 'semana1' | 'semana2' | 'semana3' | 'semana4', file: File | undefined) => {
    setPlanosMes(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        [week]: {
          ...prev[monthKey][week],
          upload: file
        }
      }
    }));
  };

  const updateMonthPlan = (monthKey: string, updates: Partial<MonthPlan>) => {
    setPlanosMes(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        ...updates
      }
    }));
  };

  const updateMonthWeekData = (monthKey: string, week: 'semana1' | 'semana2' | 'semana3' | 'semana4', data: Partial<WeekData>) => {
    setPlanosMes(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        [week]: {
          ...prev[monthKey][week],
          ...data
        }
      }
    }));
  };

  const adicionarPeriodo = () => {
    const currentYear = new Date().getFullYear();
    setPeriodosEscolhidos(prev => [...prev, { mes: 1, ano: currentYear }]);
  };

  const removerPeriodo = (index: number) => {
    setPeriodosEscolhidos(prev => {
      const novos = prev.filter((_, i) => i !== index);
      // Remove planos dos períodos removidos
      const novosPlanos = { ...planosMes };
      const removido = prev[index];
      if (removido) {
        const key = `${removido.mes}-${removido.ano}`;
        delete novosPlanos[key];
      }
      setPlanosMes(novosPlanos);
      return novos;
    });
  };

  const atualizarPeriodo = (index: number, mes: number, ano: number) => {
    setPeriodosEscolhidos(prev => {
      const novos = [...prev];
      const antigoKey = `${novos[index].mes}-${novos[index].ano}`;
      const novoKey = `${mes}-${ano}`;

      // Move plan data if key changed
      if (antigoKey !== novoKey && planosMes[antigoKey]) {
        setPlanosMes(planoPrev => {
          const novosPlanos = { ...planoPrev };
          novosPlanos[novoKey] = novosPlanos[antigoKey];
          delete novosPlanos[antigoKey];
          return novosPlanos;
        });
      }

      novos[index] = { mes, ano };
      return novos;
    });
  };

  // Initialize month plans when periods change (exclude planosMes from deps to avoid infinite loop)
  React.useEffect(() => {
    setPlanosMes(prev => {
      const updated = { ...prev };
      let changed = false;
      periodosEscolhidos.forEach(periodo => {
        const key = `${periodo.mes}-${periodo.ano}`;
        if (!updated[key]) {
          updated[key] = {
            mes: periodo.mes,
            ano: periodo.ano,
            semana1: { conteudos: '', obs: '' },
            semana2: { conteudos: '', obs: '' },
            semana3: { conteudos: '', obs: '' },
            semana4: { conteudos: '', obs: '' },
            observacoes_gerais: ''
          };
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [periodosEscolhidos]);

  const renderStep = () => {
    switch (currentStep) {
      case 'inicio':
        return (
          <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center p-4 text-neutral-900">
            <FloatingParticles />
            <Card className="w-full max-w-2xl glass animate-fade-in">
              <CardHeader className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center glow-cyan">
                  <img
                    src="/logo.png"
                    alt="Brio Educação"
                    className="w-16 h-16 object-cover rounded-full"
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-heading font-bold text-blue-500 mb-6">
                    📚 Planejamento de Conteúdo
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed text-justify px-4 text-neutral-900">
                    Olá, professor(a)!
Este formulário foi pensado para facilitar nossa parceria e apoiar ainda mais o seu trabalho em sala de aula. A ideia é simples: registrar os conteúdos que pretende trabalhar nas próximas semanas, de forma prática e organizada.                
                    <br />
                    <br />
Com essas informações, nós da Brio Educação vamos preparar cronogramas personalizados e gamificados para os alunos. Assim, eles terão mais clareza sobre o que estudar, mais autonomia para aprender no seu ritmo, e você terá mais tranquilidade para focar no que realmente importa: acompanhar o desenvolvimento de cada estudante.
                    <br />   
                    <br />                
Este é apenas o primeiro passo de uma jornada que une tecnologia e pedagogia para potencializar o aprendizado, sempre respeitando a metodologia da escola e o papel fundamental do professor.
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

      case 'como-vai-funcionar':
        return (
          <div className="min-h-screen bg-gradient-hero relative p-4">
            <FloatingParticles />
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Progress value={progress} className="w-full mb-4" />
                <h2 className="text-3xl font-heading font-bold text-center text-foreground mb-2">
                  Como vai funcionar
                </h2>
                <p className="text-center text-muted-foreground">
                  Entenda o processo de planejamento
                </p>
              </div>

              <Card className="glass animate-fade-in">
                <CardContent className="p-8">
                  <p className="text-lg text-center text-muted-foreground leading-relaxed text-neutral-900">
                    📌 <b>Você selecionará os meses em questão (por exemplo: Setembro e Outubro).</b>
                    <br />
                    <br />
                    Para cada mês, basta preencher os conteúdos previstos para as 4 semanas.
                    Cada mês será salvo separadamente, de forma organizada, sem alterar sua rotina e sem interferir no sistema pedagógico da escola.
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Voltar
                </Button>
                <Button
                  onClick={nextStep}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Continuar
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
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
                <CardContent className="p-8 space-y-6">
                  <div>
                    <Label htmlFor="nome" className="text-lg font-medium text-foreground mb-3 block text-neutral-900">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="anoLetivo" className="text-lg font-medium text-foreground mb-3 block text-neutral-900">
                        Ano letivo *
                      </Label>
                      <select
                        id="anoLetivo"
                        value={formData.anoLetivo}
                        onChange={(e) => updateFormData({ anoLetivo: e.target.value })}
                        className="w-full p-3 h-12 border border-gray-200 rounded-md bg-white text-neutral-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione o ano...</option>
                        {[2024, 2025, 2026].map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="anoEscolar" className="text-lg font-medium text-foreground mb-3 block text-neutral-900">
                        Ano escolar *
                      </Label>
                      <select
                        id="anoEscolar"
                        value={formData.anoEscolar}
                        onChange={(e) => updateFormData({ anoEscolar: e.target.value })}
                        className="w-full p-3 h-12 border border-gray-200 rounded-md bg-white text-neutral-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione o ano escolar...</option>
                        <option value="6º ano">6º ano</option>
                        <option value="7º ano">7º ano</option>
                        <option value="8º ano">8º ano</option>
                        <option value="9º ano">9º ano</option>
                      </select>
                    </div>
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
                      return (
                        <Label
                          key={discipline.id}
                          className={`relative flex items-center space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${formData.disciplina === discipline.id
                            ? 'border-accent bg-accent/10 glow-cyan'
                            : 'border-border hover:border-accent/50'
                            }`}
                        >
                          <RadioGroupItem value={discipline.id} className="sr-only" />
                          <span className="text-lg font-medium text-foreground text-neutral-900">
                            {discipline.label}
                          </span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep} className="text-white">
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

      case 'selecao-periodos':
        return (
          <div className="min-h-screen bg-gradient-hero relative p-4 text-neutral-900">
            <FloatingParticles />
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Progress value={progress} className="w-full mb-4" />
                <h2 className="text-3xl font-heading font-bold text-center text-foreground mb-2">
                  Seleção de Períodos
                </h2>
                <p className="text-center text-muted-foreground">
                  Escolha os meses que deseja planejar
                </p>
              </div>

              <Card className="glass animate-fade-in">
                <CardContent className="p-8 space-y-6">
                  <div>
                    <Label className="text-lg font-medium text-foreground mb-4 block text-neutral-900">
                      Quantos meses deseja planejar agora? *
                    </Label>
                    <RadioGroup
                      value={quantidadeMeses}
                      onValueChange={(value: '1' | '2' | '3+') => {
                        setQuantidadeMeses(value);
                        // Reset periods when changing quantity
                        const currentYear = new Date().getFullYear();
                        if (value === '1') {
                          setPeriodosEscolhidos([{ mes: 1, ano: currentYear }]);
                        } else if (value === '2') {
                          setPeriodosEscolhidos([
                            { mes: 1, ano: currentYear },
                            { mes: 2, ano: currentYear }
                          ]);
                        } else {
                          setPeriodosEscolhidos([
                            { mes: 1, ano: currentYear },
                            { mes: 2, ano: currentYear },
                            { mes: 3, ano: currentYear }
                          ]);
                        }
                      }}
                      className="flex flex-col space-y-3 text-neutral-900"
                    >
                      <Label className="flex items-center space-x-3 cursor-pointer">
                        <RadioGroupItem value="1" />
                        <span>1 mês</span>
                      </Label>
                      <Label className="flex items-center space-x-3 cursor-pointer">
                        <RadioGroupItem value="2" />
                        <span>2 meses</span>
                      </Label>
                      <Label className="flex items-center space-x-3 cursor-pointer">
                        <RadioGroupItem value="3+" />
                        <span>3+ meses</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground text-neutral-900">
                      Períodos selecionados:
                    </h3>

                    {periodosEscolhidos.map((periodo, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 rounded-lg">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground text-neutral-700">Mês</Label>
                            <select
                              value={periodo.mes}
                              onChange={(e) => atualizarPeriodo(index, parseInt(e.target.value), periodo.ano)}
                              className="w-full mt-1 p-2 border border-border rounded-md bg-gray-50 text-foreground text-neutral-900"
                            >
                              {MONTHS.map((month, monthIndex) => (
                                <option key={monthIndex} value={monthIndex + 1}>
                                  {month}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground text-neutral-700">Ano</Label>
                            <select
                              value={periodo.ano}
                              onChange={(e) => atualizarPeriodo(index, periodo.mes, parseInt(e.target.value))}
                              className="w-full mt-1 p-2 border border-border rounded-md bg-gray-50 text-foreground text-neutral-900"
                            >
                              {YEARS.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {quantidadeMeses === '3+' && periodosEscolhidos.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removerPeriodo(index)}
                            className="text-white bg-red-500 text-sm font-bold border-0 mt-5 hover:bg-red-600 hover:text-white"
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                    ))}

                    {quantidadeMeses === '3+' && (
                      <Button
                        variant="outline"
                        onClick={adicionarPeriodo}
                        className="w-full"
                      >
                        Adicionar mês
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep} className="text-white">
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

      case 'planejamento':
        return (
          <div className="min-h-screen bg-gradient-hero relative p-4">
            <FloatingParticles />
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Progress value={progress} className="w-full mb-4" />
                <h2 className="text-3xl font-heading font-bold text-center text-foreground mb-2 ">
                  Planejamento dos Meses
                </h2>
                <p className="text-center text-muted-foreground">
                  Preencha o conteúdo das 4 semanas para cada mês
                </p>
              </div>

              <div className="space-y-6">
                {periodosEscolhidos.map((periodo) => {
                  const key = `${periodo.mes}-${periodo.ano}`;
                  const plano = planosMes[key] || {
                    mes: periodo.mes,
                    ano: periodo.ano,
                    semana1: { conteudos: '', obs: '' },
                    semana2: { conteudos: '', obs: '' },
                    semana3: { conteudos: '', obs: '' },
                    semana4: { conteudos: '', obs: '' },
                    observacoes_gerais: ''
                  };
                  const mesNome = MONTHS[periodo.mes - 1];

                  return (
                    <Card key={key} className="glass animate-fade-in">
                      <CardHeader>
                        <CardTitle className="text-2xl text-foreground text-neutral-900">
                          Planejamento – {mesNome} {periodo.ano}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* 4 semanas */}
                        {(['semana1', 'semana2', 'semana3', 'semana4'] as const).map((semana) => {
                          const weekNumber = semana.replace('semana', '');
                          const weekData = plano[semana];
                          const uploadKey = `${key}_${semana}`;

                          return (
                            <div key={semana} className="border border-gray-200 rounded-lg p-6 space-y-4">
                              <h4 className="text-lg font-medium text-foreground text-neutral-900">
                                Semana {weekNumber}
                              </h4>

                              <div>
                                <Label className="text-base font-medium text-foreground mb-2 block text-neutral-900">
                                  Semana {weekNumber} – Quais conteúdos você pretende trabalhar nesta semana? *
                                </Label>
                                <Textarea
                                  placeholder="Descreva os conteúdos que serão abordados..."
                                  value={weekData.conteudos}
                                  onChange={(e) => updateMonthWeekData(key, semana, { conteudos: e.target.value })}
                                  className="min-h-[120px] text-base bg-white"
                                  required
                                />
                              </div>

                              <div>
                                <Label className="text-base font-medium text-foreground mb-2 block text-neutral-900">
                                  Adicionar foto do livro ou material de apoio (opcional)
                                </Label>
                                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-accent/50 transition-colors">
                                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                                  <Input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => handleFileUploadForMonth(key, semana, e.target.files?.[0])}
                                    className="hidden"
                                    id={`${key}_${semana}_upload`}
                                  />
                                  <Label
                                    htmlFor={`${key}_${semana}_upload`}
                                    className="text-sm text-muted-foreground cursor-pointer hover:text-accent transition-colors"
                                  >
                                    Clique para selecionar um arquivo
                                    <br />
                                    <span className="text-xs">JPG, PNG ou PDF - Máximo 10MB</span>
                                  </Label>
                                  {weekData.upload && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-sm text-accent">
                                        Arquivo: {weekData.upload.name}
                                      </p>
                                      {uploadProgress[uploadKey] === 0 && (
                                        <div className="flex items-center justify-center space-x-2">
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-accent"></div>
                                          <span className="text-xs text-muted-foreground">Fazendo upload...</span>
                                        </div>
                                      )}
                                      {uploadProgress[uploadKey] === 100 && weekData.fileUrl && (
                                        <div className="text-xs text-green-600">✅ Upload concluído</div>
                                      )}
                                      {uploadProgress[uploadKey] === -1 && (
                                        <div className="text-xs text-red-600">❌ Erro no upload</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <Label className="text-base font-medium text-foreground mb-2 block text-neutral-900">
                                  Observações para esta semana (opcional)
                                </Label>
                                <Textarea
                                  placeholder="Alguma observação específica sobre esta semana?"
                                  value={weekData.obs}
                                  onChange={(e) => updateMonthWeekData(key, semana, { obs: e.target.value })}
                                  className="min-h-[80px] bg-white"
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* Observações gerais do mês */}
                        <div>
                          <Label className="text-base font-medium text-foreground mb-2 block text-neutral-900">
                            Observações gerais do planejamento deste mês (opcional)
                          </Label>
                          <Textarea
                            placeholder="Compartilhe qualquer informação adicional sobre este mês..."
                            value={plano.observacoes_gerais}
                            onChange={(e) => updateMonthPlan(key, { observacoes_gerais: e.target.value })}
                            className="min-h-[100px] bg-white"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

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
                  Finalizar Planejamento
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'final':
        return (
          <div className="min-h-screen bg-gradient-success relative flex items-center justify-center p-4 text-neutral-900">
            <FloatingParticles />
            <Card className="w-full max-w-2xl glass animate-fade-in">
              <CardHeader className="text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-success rounded-full flex items-center justify-center glow-cyan">
                  <CheckCircle className="w-10 h-10 text-success-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl font-heading font-bold text-foreground mb-4 text-neutral-900">
                    Planejamento recebido!
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-4 text-neutral-900">
                    Muito obrigado(a) por compartilhar seu planejamento.
                    Este é um passo essencial para construirmos juntos uma implementação de sucesso, no qual:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground text-center mb-4 px-4 space-y-2 text-neutral-800">
                    <li>Os alunos terão clareza e autonomia sobre seus estudos;</li>
                    <li>Os professores contarão com uma ferramenta que reduz sobrecarga e valoriza seu tempo;</li>
                    <li>A escola terá indicadores claros de engajamento e aprendizagem.</li>
                  </ul>
                </div>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {/* Submission Status */}
                {submitStatus === 'idle' && (
                  <div className="text-center">
                    <Button
                      onClick={handleFormSubmission}
                      disabled={isSubmitting || isUploading}
                      size="lg"
                      className="bg-accent text-accent-foreground hover:bg-accent/90 glow-cyan"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enviando...
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
                      Planejamento enviado com sucesso!
                    </h3>
                    <p className="text-muted-foreground">
Nossa equipe recebeu o planejamento e vai utilizá-lo para preparar os cronogramas personalizados dos alunos.
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
                {(submitStatus === 'success') && (
                  <Button
                    onClick={() => {
                      setCurrentStep('inicio');
                      setFormData({
                        nome: '',
                        anoLetivo: new Date().getFullYear().toString(),
                        anoEscolar: '',
                        disciplina: '',
                        semana1: { conteudos: '', obs: '' },
                        semana2: { conteudos: '', obs: '' },
                        semana3: { conteudos: '', obs: '' },
                        semana4: { conteudos: '', obs: '' },
                        observacoes_gerais: '',
                      });
                      setQuantidadeMeses('1');
                      setPeriodosEscolhidos([]);
                      setPlanosMes({});
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
