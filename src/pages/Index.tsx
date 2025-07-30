// Update this page (the content is just a fallback if you fail to update the page)

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, Calculator, Receipt } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Building2 className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Lui Bambini
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistema completo de gestão financeira com Contas a Pagar e DRE (Lucro Real)
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="text-lg px-8 py-3">
              Acessar Sistema
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Upload de NFe</CardTitle>
              <CardDescription>
                Faça upload de arquivos XML e tenha as parcelas geradas automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Parse automático de dados</li>
                <li>• Geração de parcelas</li>
                <li>• Controle de fornecedores</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <Calculator className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>
                Gerencie todas as suas contas com filtros avançados e totalizadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Controle de vencimentos</li>
                <li>• Baixa com comprovantes</li>
                <li>• OCR automático</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>DRE Lucro Real</CardTitle>
              <CardDescription>
                Demonstração completa do resultado com todos os impostos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Receita bruta e CMV</li>
                <li>• Despesas operacionais</li>
                <li>• IRPJ e CSLL</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
