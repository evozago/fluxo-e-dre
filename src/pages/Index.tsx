import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, Calculator, Receipt, Package, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";

const Index = () => {
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Receipt,
      title: "Upload de NFe",
      description: "Faça upload de arquivos XML e tenha as parcelas geradas automaticamente",
      highlights: ["Parse automático de dados", "Geração de parcelas", "Controle de fornecedores"]
    },
    {
      icon: Calculator,
      title: "Contas a Pagar",
      description: "Gerencie todas as suas contas com filtros avançados e totalizadores",
      highlights: ["Controle de vencimentos", "Baixa com comprovantes", "OCR automático"]
    },
    {
      icon: Package,
      title: "Gestão de Produtos",
      description: "Sistema completo de cadastro e controle de produtos por marca",
      highlights: ["Cadastro por XML/XLSX", "Variações de cor/tamanho", "Controle de estoque"]
    },
    {
      icon: TrendingUp,
      title: "Vendas & Metas",
      description: "Controle de vendas por vendedora com sistema de metas e comissões",
      highlights: ["Metas mensais", "Cálculo de comissões", "Relatórios de performance"]
    },
    {
      icon: Building2,
      title: "DRE Lucro Real",
      description: "Demonstração completa do resultado com todos os impostos",
      highlights: ["Receita bruta e CMV", "Despesas operacionais", "IRPJ e CSLL"]
    },
    {
      icon: Shield,
      title: "Sistema Seguro",
      description: "Plataforma segura com backup automático e controle de acesso",
      highlights: ["Backup automático", "Controle de usuários", "Segurança de dados"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <section className="section-spacing">
        <div className="container-responsive">
          <div className="text-center space-y-6">
            <div className="animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <Building2 className="h-12 w-12 text-primary" />
                </div>
              </div>
              
              <h1 className="heading-xl bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent font-bold text-balance">
                Lui Bambini
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance element-spacing">
                Sistema completo de gestão financeira e operacional com Contas a Pagar, 
                Gestão de Produtos, Vendas e DRE (Lucro Real)
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button 
                      size={isMobile ? "default" : "lg"} 
                      className="w-full sm:w-auto text-lg px-8 py-3 gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Ir para o Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button 
                      size={isMobile ? "default" : "lg"} 
                      className="w-full sm:w-auto text-lg px-8 py-3 gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Fazer Login
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                
                <Button 
                  variant="outline" 
                  size={isMobile ? "default" : "lg"}
                  className="w-full sm:w-auto px-8 py-3"
                >
                  Ver Demonstração
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-spacing bg-card/50">
        <div className="container-responsive">
          <div className="text-center element-spacing">
            <h2 className="heading-lg text-balance">
              Funcionalidades Completas
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seu negócio em uma única plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="card-elevated card-interactive group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-spacing">
        <div className="container-responsive">
          <div className="text-center element-spacing">
            <h2 className="heading-lg text-balance">
              Sistema Completo e Confiável
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Desenvolvido especificamente para pequenas e médias empresas
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { number: "100%", label: "Responsivo", description: "Funciona em qualquer dispositivo" },
              { number: "24/7", label: "Disponível", description: "Sistema sempre online" },
              { number: "XML", label: "Automação", description: "Import automático de NFe" },
              { number: "∞", label: "Escalável", description: "Cresce com seu negócio" }
            ].map((stat, index) => (
              <Card key={index} className="text-center card-elevated">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {stat.number}
                  </div>
                  <div className="font-medium mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.description}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing bg-primary/5">
        <div className="container-responsive">
          <Card className="card-elevated border-primary/20">
            <CardContent className="text-center py-12">
              <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="heading-lg text-balance">
                  Pronto para começar?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Experimente todas as funcionalidades do sistema e veja como 
                  pode simplificar a gestão do seu negócio.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {isAuthenticated ? (
                    <Link to="/dashboard">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto text-lg px-8 py-3 gap-2"
                      >
                        Ir para o Dashboard
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/auth">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto text-lg px-8 py-3 gap-2"
                      >
                        Fazer Login Seguro
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container-responsive py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Lui Bambini - Sistema de Gestão Empresarial</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;