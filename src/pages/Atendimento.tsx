import { useState } from 'react';
import { MessageSquare, User, Plus, Filter } from 'lucide-react';
import { FilterBar } from '@/components/atendimento/FilterBar';
import { AtendimentosList } from '@/components/atendimento/AtendimentosList';
import { ChatWhatsApp } from '@/components/atendimento/ChatWhatsApp';
import { ClienteInfo } from '@/components/atendimento/ClienteInfo';
import { ContactsList } from '@/components/atendimento/ContactsList';
import { TransferDialog } from '@/components/atendimento/TransferDialog';
import { ConfirmSaveContactDialog } from '@/components/contatos/ConfirmSaveContactDialog';
import { NovoContatoDialog } from '@/components/contatos/NovoContatoDialog';
import { useContactCheck } from '@/hooks/useContactCheck';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Dados de exemplo com transferências
const dadosAtendimentos = [
  {
    id: 1,
    cliente: 'João Silva',
    telefone: '+55 11 99999-9999',
    ultimaMensagem: 'Preciso de ajuda com meu pedido #12345, não chegou ainda',
    tempo: '5 min',
    setor: 'Suporte',
    agente: 'Ana Silva',
    tags: ['Pedido', 'Urgente'],
    status: 'em-atendimento' as const,
    transferencia: {
      de: 'Carlos Santos',
      motivo: 'Cliente solicitou falar com supervisor',
      dataTransferencia: '14:25'
    }
  },
  {
    id: 2,
    cliente: 'Maria Santos',
    telefone: '+55 11 88888-8888',
    ultimaMensagem: 'Olá, gostaria de mais informações sobre o plano premium',
    tempo: '12 min',
    setor: 'Vendas',
    tags: ['Novo Cliente'],
    status: 'novos' as const
  },
  {
    id: 3,
    cliente: 'Pedro Almeida',
    telefone: '+55 11 77777-7777',
    ultimaMensagem: 'Quando vocês vão lançar o novo produto?',
    tempo: '30 min',
    setor: 'Marketing',
    agente: 'Carlos Oliveira',
    status: 'pendentes' as const
  },
  {
    id: 4,
    cliente: 'Ana Pereira',
    telefone: '+55 11 66666-6666',
    ultimaMensagem: 'O problema foi resolvido, muito obrigado!',
    tempo: '1 hora',
    setor: 'Suporte',
    agente: 'Marcos Silva',
    status: 'finalizados' as const
  },
  {
    id: 5,
    cliente: 'Roberto Gomes',
    telefone: '+55 11 55555-5555',
    ultimaMensagem: 'Preciso trocar o produto que comprei ontem',
    tempo: '2 min',
    setor: 'Suporte',
    tags: ['Troca', 'Urgente'],
    status: 'novos' as const
  },
  {
    id: 6,
    cliente: 'Fernanda Lima',
    telefone: '+55 11 44444-4444',
    ultimaMensagem: 'Obrigado pelo atendimento, foi muito útil!',
    tempo: '3 horas',
    setor: 'Vendas',
    agente: 'Ana Silva',
    status: 'finalizados' as const
  }
];

// Configuração simulada do limite de mensagens (normalmente viria do Painel)
const LIMITE_MENSAGENS_ABERTAS = 5; // Configurável pelo administrador

const mensagensExemplo = [
  { id: 1, texto: 'Olá! Preciso de ajuda com meu pedido #12345', autor: 'cliente' as const, tempo: '14:30' },
  { id: 2, texto: 'Olá João! Claro, vou verificar seu pedido. Um momento por favor.', autor: 'agente' as const, tempo: '14:31', status: 'lido' as const },
  { id: 3, texto: 'Estou vendo aqui no sistema que seu pedido está em separação no estoque e deve ser enviado hoje ainda.', autor: 'agente' as const, tempo: '14:32', status: 'lido' as const },
  { id: 4, texto: 'Perfeito! Muito obrigado pelo atendimento rápido.', autor: 'cliente' as const, tempo: '14:33' },
  { id: 5, texto: 'Você consegue me passar o código de rastreamento?', autor: 'cliente' as const, tempo: '14:34' },
  { id: 6, texto: 'Claro! Assim que o pedido for despachado, o código de rastreamento será enviado automaticamente para o seu email e também para o seu WhatsApp.', autor: 'agente' as const, tempo: '14:35', status: 'lido' as const }
];

const clienteExemplo = {
  id: 1,
  nome: 'João Silva',
  telefone: '+55 11 99999-9999',
  email: 'joao.silva@email.com',
  dataCadastro: '15/03/2023',
  tags: ['Cliente Fiel', 'Premium'],
  historico: [
    { id: 1, data: '10/05/2023', assunto: 'Problema com entrega', status: 'Resolvido' },
    { id: 2, data: '23/06/2023', assunto: 'Troca de produto', status: 'Resolvido' },
    { id: 3, data: '05/09/2023', assunto: 'Dúvida sobre garantia', status: 'Resolvido' }
  ]
};

// Dados de contatos mockados
const contatosMockInicial = [
  {
    id: 1,
    nome: 'Carlos Mendes',
    telefone: '+55 11 91234-5678',
    email: 'carlos.mendes@email.com',
    status: 'online' as const,
    ultimoContato: '2 dias atrás'
  },
  {
    id: 2,
    nome: 'Fernanda Costa',
    telefone: '+55 11 98765-4321',
    email: 'fernanda.costa@email.com',
    status: 'offline' as const,
    ultimoContato: '1 semana atrás'
  },
  {
    id: 3,
    nome: 'Ricardo Silva',
    telefone: '+55 11 95555-1234',
    status: 'online' as const,
    ultimoContato: '3 dias atrás'
  },
  {
    id: 4,
    nome: 'Juliana Santos',
    telefone: '+55 11 97777-8888',
    email: 'juliana.santos@email.com',
    status: 'offline' as const,
    ultimoContato: '5 dias atrás'
  }
];

export default function Atendimento() {
  const [selectedAtendimento, setSelectedAtendimento] = useState<typeof dadosAtendimentos[0] | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [contatos, setContatos] = useState(contatosMockInicial); // Estado local dos contatos
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Hook para gerenciar verificação e salvamento de contatos
  const {
    pendingContact,
    showConfirmDialog,
    showNovoContatoDialog,
    setShowConfirmDialog,
    setShowNovoContatoDialog,
    handleFinalizarWithContactCheck,
    handleConfirmSave,
    handleCancelSave,
    handleContactSaved
  } = useContactCheck();

  // Calcular mensagens em aberto para o agente atual
  const mensagensEmAberto = dadosAtendimentos.filter(a => 
    (a.status === 'novos' || a.status === 'em-atendimento') && 
    a.agente === 'Ana Silva' // Agente atual simulado
  ).length;

  const podeIniciarNovoAtendimento = mensagensEmAberto < LIMITE_MENSAGENS_ABERTAS;
  
  const handleSelectAtendimento = (atendimento: typeof dadosAtendimentos[0]) => {
    setSelectedAtendimento(atendimento);
    setShowContacts(false);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleReturnToList = () => {
    setShowChat(false);
    setShowContacts(false);
  };

  const handleSairConversa = () => {
    setSelectedAtendimento(null);
    if (isMobile) {
      setShowChat(false);
    }
  };

  const handleTransferir = () => {
    setShowTransferDialog(true);
  };

  const handleFinalizar = () => {
    if (!selectedAtendimento) return;

    // Agente e setor atuais (normalmente viriam do contexto de autenticação)
    const agenteAtual = 'Ana Silva';
    const setorAtual = 'Suporte';

    // Usa o hook para verificar se deve salvar contato
    handleFinalizarWithContactCheck(
      selectedAtendimento,
      contatos,
      agenteAtual,
      setorAtual,
      () => {
        console.log('Finalizar atendimento');
        setSelectedAtendimento(null);
        if (isMobile) {
          setShowChat(false);
        }
      }
    );
  };

  const handleNovaConversa = () => {
    if (!podeIniciarNovoAtendimento) {
      toast({
        title: "Limite atingido",
        description: `Você atingiu o limite de ${LIMITE_MENSAGENS_ABERTAS} mensagens em aberto. Finalize ou transfira alguns atendimentos para iniciar novos.`,
        variant: "destructive"
      });
      return;
    }
    setShowContacts(true);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleSelectContact = (contato: typeof contatos[0]) => {
    if (!podeIniciarNovoAtendimento) {
      toast({
        title: "Limite atingido",
        description: `Você atingiu o limite de ${LIMITE_MENSAGENS_ABERTAS} mensagens em aberto. Finalize ou transfira alguns atendimentos para iniciar novos.`,
        variant: "destructive"
      });
      return;
    }

    // Criar novo atendimento baseado no contato selecionado
    const novoAtendimento = {
      id: dadosAtendimentos.length + 1,
      cliente: contato.nome,
      telefone: contato.telefone,
      ultimaMensagem: 'Nova conversa iniciada',
      tempo: 'agora',
      setor: 'Suporte',
      tags: [], // Add missing tags property as empty array
      status: 'novos' as const
    };
    
    setSelectedAtendimento(novoAtendimento);
    setShowContacts(false);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleConfirmTransfer = (agente: string, motivo: string) => {
    console.log('Transferir para:', agente, 'Motivo:', motivo);
    toast({
      title: "Atendimento transferido",
      description: `Atendimento transferido para ${agente} com sucesso.`,
    });
    setShowTransferDialog(false);
    setSelectedAtendimento(null);
    if (isMobile) {
      setShowChat(false);
    }
  };

  const handleContatoAdicionado = (novoContato: any) => {
    setContatos(prev => [...prev, { ...novoContato, id: prev.length + 1 }]);
    handleContactSaved();
    toast({
      title: "Contato salvo",
      description: `${novoContato.nome} foi adicionado aos contatos com sucesso.`
    });
  };

  // Layout mobile: mostra lista, contatos ou chat baseado no estado
  if (isMobile) {
    return (
      <div className="min-h-screen">
        {!showChat ? (
          // Mostra lista de atendimentos
          <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
              <FilterBar />
              <Button 
                onClick={handleNovaConversa}
                disabled={!podeIniciarNovoAtendimento}
                className="bg-green-500 hover:bg-green-600 text-white ml-2 w-10 h-10 p-0"
                size="icon"
                title={!podeIniciarNovoAtendimento ? `Limite de ${LIMITE_MENSAGENS_ABERTAS} mensagens atingido` : 'Nova conversa'}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AtendimentosList 
                atendimentos={dadosAtendimentos} 
                onSelectAtendimento={handleSelectAtendimento}
                selectedAtendimento={selectedAtendimento}
                isMobile={isMobile}
              />
            </div>
          </div>
        ) : showContacts ? (
          // Mostra lista de contatos
          <ContactsList
            contatos={contatos}
            onSelectContact={handleSelectContact}
            onBack={handleReturnToList}
          />
        ) : selectedAtendimento ? (
          // Mostra chat em tela cheia
          <div className="h-full">
            <ChatWhatsApp 
              cliente={{
                id: selectedAtendimento.id,
                nome: selectedAtendimento.cliente,
                telefone: selectedAtendimento.telefone,
                status: 'online'
              }}
              mensagens={mensagensExemplo}
              onReturnToList={handleReturnToList}
              onSairConversa={handleSairConversa}
              onTransferir={handleTransferir}
              onFinalizar={handleFinalizar}
            />
          </div>
        ) : null}

        {/* Dialog de transferência */}
        <TransferDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          onConfirm={handleConfirmTransfer}
        />

        {/* Dialog de confirmação para salvar contato */}
        <ConfirmSaveContactDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleConfirmSave}
          onCancel={handleCancelSave}
          clienteNome={pendingContact?.nome || ''}
          clienteTelefone={pendingContact?.telefone || ''}
        />

        {/* Dialog para criar novo contato com dados pré-preenchidos */}
        <NovoContatoDialog
          open={showNovoContatoDialog}
          onOpenChange={setShowNovoContatoDialog}
          onContatoAdicionado={handleContatoAdicionado}
          dadosIniciais={pendingContact || undefined}
        />
      </div>
    );
  }

  // Layout desktop: duas colunas
  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Primeira Coluna - Pesquisa, Filtros e Atendimentos */}
        <div className="col-span-5 flex flex-col">
          {/* Barra de filtros e pesquisa */}
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <FilterBar />
            </div>
            <Button 
              onClick={handleNovaConversa}
              disabled={!podeIniciarNovoAtendimento}
              className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 p-0"
              size="icon"
              title={!podeIniciarNovoAtendimento ? `Limite de ${LIMITE_MENSAGENS_ABERTAS} mensagens atingido` : 'Nova conversa'}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Lista de atendimentos ou contatos */}
          <div className="flex-1 mt-4">
            {showContacts ? (
              <ContactsList
                contatos={contatos}
                onSelectContact={handleSelectContact}
                onBack={() => setShowContacts(false)}
              />
            ) : (
              <AtendimentosList 
                atendimentos={dadosAtendimentos} 
                onSelectAtendimento={handleSelectAtendimento}
                selectedAtendimento={selectedAtendimento}
              />
            )}
          </div>
        </div>

        {/* Segunda Coluna - Chat e Informações do Cliente */}
        <div className="col-span-7 grid grid-rows-3 gap-4 h-full">
          {/* Chat do WhatsApp - ocupa 2/3 da altura */}
          <div className="row-span-2">
            {selectedAtendimento ? (
              <ChatWhatsApp 
                cliente={{
                  id: selectedAtendimento.id,
                  nome: selectedAtendimento.cliente,
                  telefone: selectedAtendimento.telefone,
                  status: 'online'
                }}
                mensagens={mensagensExemplo}
                onSairConversa={handleSairConversa}
                onTransferir={handleTransferir}
                onFinalizar={handleFinalizar}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-white rounded-xl border border-dashed border-gray-300">
                <div className="text-center p-6">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">Selecione uma conversa</h3>
                  <p className="text-sm text-gray-500">Clique em uma conversa para iniciar o atendimento</p>
                  {!podeIniciarNovoAtendimento && (
                    <p className="text-xs text-orange-600 mt-2">
                      Limite de {LIMITE_MENSAGENS_ABERTAS} mensagens em aberto atingido
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Informações do cliente - ocupa 1/3 da altura */}
          <div className="row-span-1">
            {selectedAtendimento ? (
              <ClienteInfo 
                cliente={clienteExemplo} 
                transferencia={selectedAtendimento.transferencia}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-white rounded-xl border border-dashed border-gray-300">
                <div className="text-center">
                  <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Dados do cliente</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de transferência */}
      <TransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        onConfirm={handleConfirmTransfer}
      />

      {/* Dialog de confirmação para salvar contato */}
      <ConfirmSaveContactDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
        clienteNome={pendingContact?.nome || ''}
        clienteTelefone={pendingContact?.telefone || ''}
      />

      {/* Dialog para criar novo contato com dados pré-preenchidos */}
      <NovoContatoDialog
        open={showNovoContatoDialog}
        onOpenChange={setShowNovoContatoDialog}
        onContatoAdicionado={handleContatoAdicionado}
        dadosIniciais={pendingContact || undefined}
      />
    </div>
  );
}
