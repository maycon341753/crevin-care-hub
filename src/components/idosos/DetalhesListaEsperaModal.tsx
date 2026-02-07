import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IdosoListaEspera {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo?: 'masculino' | 'feminino';
  telefone?: string;
  endereco?: string;
  responsavel_nome?: string;
  responsavel_telefone?: string;
  responsavel_parentesco?: string;
  observacoes?: string;
  data_cadastro: string;
  status: 'aguardando' | 'contatado' | 'transferido' | 'cancelado';
  posicao_fila: number;
}

interface DetalhesListaEsperaModalProps {
  isOpen: boolean;
  onClose: () => void;
  idoso: IdosoListaEspera;
}

export function DetalhesListaEsperaModal({ isOpen, onClose, idoso }: DetalhesListaEsperaModalProps) {
  if (!idoso) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  const calculateIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  const formatCPF = (value: string) => {
    if (!value) return "-";
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    if (!value) return "-";
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Idoso - Lista de Espera</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-gray-500 text-xs uppercase tracking-wider">Nome Completo</Label>
              <div className="font-medium">{idoso.nome}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-gray-500 text-xs uppercase tracking-wider">CPF</Label>
              <div>{formatCPF(idoso.cpf)}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-gray-500 text-xs uppercase tracking-wider">Data de Nascimento</Label>
              <div>{formatDate(idoso.data_nascimento)} ({calculateIdade(idoso.data_nascimento)} anos)</div>
            </div>

            <div className="space-y-1">
              <Label className="text-gray-500 text-xs uppercase tracking-wider">Data de Cadastro</Label>
              <div>{formatDate(idoso.data_cadastro)}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-gray-500 text-xs uppercase tracking-wider">Sexo</Label>
              <div className="capitalize">{idoso.sexo || "-"}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-gray-500 text-xs uppercase tracking-wider">Telefone</Label>
              <div>{formatPhone(idoso.telefone || "")}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-gray-500 text-xs uppercase tracking-wider">Status</Label>
              <div className="capitalize">{idoso.status}</div>
            </div>

             <div className="space-y-1">
              <Label className="text-gray-500 text-xs uppercase tracking-wider">Posição na Fila</Label>
              <div>{idoso.posicao_fila}º</div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-gray-500 text-xs uppercase tracking-wider">Endereço</Label>
            <div>{idoso.endereco || "-"}</div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Dados do Responsável</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-gray-500 text-xs uppercase tracking-wider">Nome do Responsável</Label>
                <div>{idoso.responsavel_nome || "-"}</div>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-500 text-xs uppercase tracking-wider">Telefone do Responsável</Label>
                <div>{formatPhone(idoso.responsavel_telefone || "")}</div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-gray-500 text-xs uppercase tracking-wider">Parentesco</Label>
                <div>{idoso.responsavel_parentesco || "-"}</div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-gray-500 text-xs uppercase tracking-wider">Observações</Label>
            <div className="bg-gray-50 p-3 rounded-md min-h-[80px] text-sm">
              {idoso.observacoes || "Nenhuma observação registrada."}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
