import { useState } from 'react';
import { Send, Paperclip, Mic, User, Phone, MoreVertical, ArrowLeft, LogOut, ArrowRight, Clock, Image, FileText, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useZApi } from '@/hooks/useZApi';
import { useWhatsAppConnections } from '@/hooks/useWhatsAppConnections';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  texto: string;
  anexo?: {
    tipo: 'imagem' | 'audio' | 'documento' | 'video' | 'contato';
    url?: string;
    nome?: string;
  };
  autor: 'cliente' | 'agente';
  tempo: string;
  status?: 'enviado' | 'entregue' | 'lido';
}

interface ClienteInfo {
  id: number;
  nome: string;
  telefone: string;
  avatar?: string;
  status?: 'online' | 'offline';
  ultimoAcesso?: string;
}

interface TransferenciaInfo {
  de: string;
  motivo: string;
  dataTransferencia: string;
}

interface ChatWhatsAppProps {
  cliente: ClienteInfo;
  mensagens: Message[];
  onReturnToList?: () => void;
  onSairConversa?: () => void;
  onTransferir?: () => void;
  onFinalizar?: () => void;
  transferencia?: TransferenciaInfo;
}

export function ChatWhatsApp({ 
  cliente, 
  mensagens: initialMensagens, 
  onReturnToList,
  onSairConversa,
  onTransferir,
  onFinalizar,
  transferencia
}: ChatWhatsAppProps) {
  const [mensagens, setMensagens] = useState<Message[]>(initialMensagens);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [anexoSelecionado, setAnexoSelecionado] = useState<File | null>(null);
  
  const { sendMessage, sendImageMessage, sendDocumentMessage, sendAudioMessage } = useZApi();
  const { hasConnectedWhatsApp } = useWhatsAppConnections();
  const { toast } = useToast();
  
  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim() && !anexoSelecionado) return;
    
    if (!hasConnectedWhatsApp) {
      toast({
        title: "WhatsApp Desconectado",
        description: "Configure uma conexão WhatsApp no painel primeiro",
        variant: "destructive",
      });
      return;
    }

    let success = false;
    let novaMsgObj: Message;

    if (anexoSelecionado) {
      // Simular upload do anexo e obter URL
      const anexoUrl = URL.createObjectURL(anexoSelecionado);
      
      novaMsgObj = {
        id: mensagens.length + 1,
        texto: novaMensagem || '',
        anexo: {
          tipo: anexoSelecionado.type.startsWith('image/') ? 'imagem' : 
                anexoSelecionado.type.startsWith('audio/') ? 'audio' : 'documento',
          url: anexoUrl,
          nome: anexoSelecionado.name
        },
        autor: 'agente',
        tempo: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'enviado'
      };

      // Enviar via Z-API baseado no tipo de arquivo
      if (anexoSelecionado.type.startsWith('image/')) {
        success = await sendImageMessage(cliente.telefone, anexoUrl, novaMensagem);
      } else if (anexoSelecionado.type.startsWith('audio/')) {
        success = await sendAudioMessage(cliente.telefone, anexoUrl);
      } else {
        success = await sendDocumentMessage(cliente.telefone, anexoUrl, anexoSelecionado.name);
      }
      
      setAnexoSelecionado(null);
    } else {
      // Mensagem de texto
      novaMsgObj = {
        id: mensagens.length + 1,
        texto: novaMensagem,
        autor: 'agente',
        tempo: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'enviado'
      };

      success = await sendMessage(cliente.telefone, novaMensagem);
    }

    if (success) {
      setMensagens([...mensagens, novaMsgObj]);
      setNovaMensagem('');
      
      // Simular alteração do status da mensagem
      setTimeout(() => {
        setMensagens(msgs => 
          msgs.map(m => m.id === novaMsgObj.id ? {...m, status: 'entregue'} : m)
        );
      }, 1000);
      
      // Simular resposta do cliente após 2 segundos
      setTimeout(() => {
        setIsTyping(true);
      }, 1500);
      
      setTimeout(() => {
        setIsTyping(false);
        setMensagens(msgs => [
          ...msgs, 
          {
            id: msgs.length + 1,
            texto: "Obrigado pelo atendimento!",
            autor: 'cliente',
            tempo: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 3500);
    }
  };

  const handleAnexoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAnexoSelecionado(file);
    }
  };

  const renderAnexo = (anexo: Message['anexo']) => {
    if (!anexo) return null;

    switch (anexo.tipo) {
      case 'imagem':
        return (
          <div className="mb-2 rounded overflow-hidden max-w-xs">
            <img src={anexo.url} alt="Imagem" className="max-w-full h-auto" />
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded mb-2">
            <Volume2 className="w-4 h-4 text-gray-600" />
            <span className="text-sm">Áudio</span>
            <audio controls className="h-8">
              <source src={anexo.url} />
            </audio>
          </div>
        );
      case 'documento':
        return (
          <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded mb-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm">{anexo.nome || 'Documento'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header do Chat */}
      <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={onReturnToList}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
            {cliente.avatar ? (
              <img src={cliente.avatar} alt={cliente.nome} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900">{cliente.nome}</h3>
              {cliente.status && (
                <Badge variant="outline" className={
                  cliente.status === 'online' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600'
                }>
                  {cliente.status === 'online' ? 'Online' : 'Offline'}
                </Badge>
              )}
              {!hasConnectedWhatsApp && (
                <Badge variant="destructive" className="text-xs">
                  WhatsApp Desconectado
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">{cliente.telefone}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Phone className="w-5 h-5 text-gray-600" />
          </Button>
          
          {/* Popover com ações do atendimento */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onSairConversa}
                  className="w-full justify-start bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da conversa
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onTransferir}
                  className="w-full justify-start"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Transferir
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onFinalizar}
                  className="w-full justify-start bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                >
                  Finalizar atendimento
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Área de mensagens com altura fixa e rolagem interna */}
      <div className="flex-grow min-h-0 bg-gray-100">
        <ScrollArea className="h-full p-4">
          <div className="space-y-3">
            {mensagens.map((mensagem) => (
              <div key={mensagem.id} 
                className={`flex ${mensagem.autor === 'agente' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] sm:max-w-[80%] md:max-w-[70%] px-3 sm:px-4 py-2 rounded-lg break-words ${
                    mensagem.autor === 'agente' 
                      ? 'bg-green-50 border border-green-100 text-gray-800' 
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {renderAnexo(mensagem.anexo)}
                  
                  {mensagem.texto && <p className="text-sm break-words">{mensagem.texto}</p>}
                  
                  <div className={`flex justify-end items-center space-x-1 mt-1 text-xs ${
                    mensagem.autor === 'agente' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <span>{mensagem.tempo}</span>
                    {mensagem.autor === 'agente' && mensagem.status && (
                      <span className="text-blue-500">
                        {mensagem.status === 'lido' ? '✓✓' : mensagem.status === 'entregue' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-500 animate-pulse">
                  digitando...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Preview do anexo selecionado */}
      {anexoSelecionado && (
        <div className="p-3 bg-yellow-50 border-b border-yellow-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Image className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Anexo: {anexoSelecionado.name}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setAnexoSelecionado(null)}
              className="text-yellow-600 hover:text-yellow-700"
            >
              Remover
            </Button>
          </div>
        </div>
      )}
      
      {/* Input de mensagem */}
      <div className="bg-white p-3 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="file"
              id="anexo"
              className="hidden"
              accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleAnexoChange}
            />
            <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
              <label htmlFor="anexo" className="cursor-pointer">
                <Paperclip className="w-5 h-5 text-gray-500" />
              </label>
            </Button>
          </div>
          
          <Input 
            placeholder="Digite uma mensagem..." 
            className="flex-grow text-sm"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEnviarMensagem();
              }
            }}
          />
          
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Mic className="w-5 h-5 text-gray-500" />
          </Button>
          
          <Button 
            size="icon" 
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={(!novaMensagem.trim() && !anexoSelecionado) || !hasConnectedWhatsApp}
            onClick={handleEnviarMensagem}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
