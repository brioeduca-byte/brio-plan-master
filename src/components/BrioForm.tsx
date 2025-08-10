import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Upload, BookOpen, Calculator, PenTool, Scroll, Globe, Microscope, CheckCircle } from 'lucide-react';

type Discipline = 'matematica' | 'portugues' | 'historia' | 'geografia' | 'ciencias';

interface WeekData {
  conteudos: string;
  upload?: File;
  obs: string;
}

interface FormData {
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

const STEPS = ['inicio', 'disciplina', 'semana1', 'semana2', 'semana3', 'semana4', 'observacoes', 'final'] as const;
type Step = typeof STEPS[number];

const BrioForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('inicio');
  const [formData, setFormData] = useState<FormData>({
    disciplina: '',
    semana1: { conteudos: '', obs: '' },
    semana2: { conteudos: '', obs: '' },
    semana3: { conteudos: '', obs: '' },
    semana4: { conteudos: '', obs: '' },
    observacoes_gerais: '',
  });

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const updateFormData = useCallback((updates: Partial<FormData>) => {
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
                  className="bg-accent text-accent-foreground hover:bg-accent/90 glow-cyan animate-pulse-glow"
                >
                  Começar Planejamento
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
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
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
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
                        <p className="mt-2 text-sm text-accent">
                          Arquivo selecionado: {weekData.upload.name}
                        </p>
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
                  onClick={nextStep}
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
              <CardContent className="text-center">
                <Button
                  onClick={() => {
                    setCurrentStep('inicio');
                    setFormData({
                      disciplina: '',
                      semana1: { conteudos: '', obs: '' },
                      semana2: { conteudos: '', obs: '' },
                      semana3: { conteudos: '', obs: '' },
                      semana4: { conteudos: '', obs: '' },
                      observacoes_gerais: '',
                    });
                  }}
                  size="lg"
                  className="bg-success text-success-foreground hover:bg-success/90 glow-cyan"
                >
                  Criar Novo Planejamento
                </Button>
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