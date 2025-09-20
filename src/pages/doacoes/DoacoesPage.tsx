import { useState } from "react";
import { Plus, Search, Download, Receipt, HandHeart, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data
const doacoesDinheiro = [
  {
    id: 1,
    protocolo: "001-2025",
    doador: "Maria Santos",
    cpf: "123.456.789-01",
    valor: 500,
    tipo: "PIX",
    data: "2025-01-15",
    telefone: "(61) 99999-1111",
  },
  {
    id: 2,
    protocolo: "002-2025",
    doador: "João Silva",
    cpf: "234.567.890-12",
    valor: 1000,
    tipo: "Cartão",
    data: "2025-01-14",
    telefone: "(61) 99999-2222",
  },
  {
    id: 3,
    protocolo: "003-2025",
    doador: "Ana Costa",
    cpf: "345.678.901-23",
    valor: 250,
    tipo: "Dinheiro",
    data: "2025-01-13",
    telefone: "(61) 99999-3333",
  },
];

const doacoesItens = [
  {
    id: 1,
    protocolo: "016092025",
    doador: "Carlos Oliveira",
    cpf: "456.789.012-34",
    item: "Fraldas Geriátricas",
    quantidade: "50 unidades",
    data: "2025-01-15",
    telefone: "(61) 99999-4444",
  },
  {
    id: 2,
    protocolo: "017092025",
    doador: "Lucia Ferreira",
    cpf: "567.890.123-45",
    item: "Medicamentos",
    quantidade: "2kg",
    data: "2025-01-14",
    telefone: "(61) 99999-5555",
  },
];

export default function DoacoesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const getTipoBadge = (tipo: string) => {
    const colors = {
      "PIX": "bg-success text-success-foreground",
      "Cartão": "bg-primary text-primary-foreground",
      "Dinheiro": "bg-warning text-warning-foreground",
    };
    return colors[tipo as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const totalDoacoesDinheiro = doacoesDinheiro.reduce((acc, doacao) => acc + doacao.valor, 0);
  const totalDoacoesItens = doacoesItens.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Doações</h1>
          <p className="text-muted-foreground">
            Gerencie doações em dinheiro e itens recebidos pela CREVIN
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          <Button className="bg-gradient-secondary hover:bg-secondary-hover">
            <Plus className="h-4 w-4 mr-2" />
            Nova Doação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Dinheiro (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {totalDoacoesDinheiro.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Doações de Itens (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{totalDoacoesItens}</div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Doadores Únicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
          </CardContent>
        </Card>
        <Card className="crevin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recibos Gerados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different types of donations */}
      <Card className="crevin-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5 text-secondary" />
            Registro de Doações
          </CardTitle>
          <CardDescription>
            Gerencie doações em dinheiro e itens recebidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dinheiro" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dinheiro" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Doações em Dinheiro
              </TabsTrigger>
              <TabsTrigger value="itens" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Doações de Itens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dinheiro" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por doador ou protocolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Doador</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doacoesDinheiro.map((doacao) => (
                      <TableRow key={doacao.id}>
                        <TableCell className="font-mono">{doacao.protocolo}</TableCell>
                        <TableCell className="font-medium">{doacao.doador}</TableCell>
                        <TableCell>{doacao.cpf}</TableCell>
                        <TableCell className="font-semibold text-success">
                          R$ {doacao.valor.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTipoBadge(doacao.tipo)}>
                            {doacao.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(doacao.data).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Receipt className="h-4 w-4 mr-2" />
                            Recibo
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="itens" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por doador ou protocolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Doador</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doacoesItens.map((doacao) => (
                      <TableRow key={doacao.id}>
                        <TableCell className="font-mono">{doacao.protocolo}</TableCell>
                        <TableCell className="font-medium">{doacao.doador}</TableCell>
                        <TableCell>{doacao.cpf}</TableCell>
                        <TableCell>{doacao.item}</TableCell>
                        <TableCell className="font-semibold text-secondary">
                          {doacao.quantidade}
                        </TableCell>
                        <TableCell>
                          {new Date(doacao.data).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Receipt className="h-4 w-4 mr-2" />
                            Guia
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}