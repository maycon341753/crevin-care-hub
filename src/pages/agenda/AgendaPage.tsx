import { useState, useEffect, useCallback } from "react";
import { Calendar, Plus, Search, Filter, Clock, MapPin, Users, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AddEventModal } from "@/components/agenda/AddEventModal";

interface AgendaEvent {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  tipo: string;
  status: string;
  prioridade: string;
  local?: string;
  participantes?: string[];
  criado_por?: string;
  idoso_id?: string;
  funcionario_id?: string;
  all_day: boolean;
  recorrencia?: string;
  cor: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

const AgendaPage = () => {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AgendaEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .order('data_inicio', { ascending: true });

      if (error) {
        console.error('Erro ao buscar eventos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os eventos da agenda.",
          variant: "destructive",
        });
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar eventos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    let filtered = events;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.local?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (selectedStatus !== "todos") {
      filtered = filtered.filter(event => event.status === selectedStatus);
    }

    // Filtrar por tipo
    if (selectedType !== "todos") {
      filtered = filtered.filter(event => event.tipo === selectedType);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedStatus, selectedType]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      agendado: { label: "Agendado", variant: "default" as const },
      em_andamento: { label: "Em Andamento", variant: "secondary" as const },
      concluido: { label: "Concluído", variant: "outline" as const },
      cancelado: { label: "Cancelado", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.agendado;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (prioridade: string) => {
    const priorityConfig = {
      baixa: { label: "Baixa", className: "bg-green-100 text-green-800" },
      media: { label: "Média", className: "bg-yellow-100 text-yellow-800" },
      alta: { label: "Alta", className: "bg-orange-100 text-orange-800" },
      urgente: { label: "Urgente", className: "bg-red-100 text-red-800" },
    };
    
    const config = priorityConfig[prioridade as keyof typeof priorityConfig] || priorityConfig.media;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTypeBadge = (tipo: string) => {
    const typeConfig = {
      evento: { label: "Evento", className: "bg-blue-100 text-blue-800" },
      consulta: { label: "Consulta", className: "bg-purple-100 text-purple-800" },
      atividade: { label: "Atividade", className: "bg-green-100 text-green-800" },
      reuniao: { label: "Reunião", className: "bg-gray-100 text-gray-800" },
      terapia: { label: "Terapia", className: "bg-pink-100 text-pink-800" },
    };
    
    const config = typeConfig[tipo as keyof typeof typeConfig] || typeConfig.evento;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatEventTime = (dataInicio: string, dataFim?: string, allDay?: boolean) => {
    if (allDay) return "Dia todo";
    
    const inicio = parseISO(dataInicio);
    const timeFormat = "HH:mm";
    
    if (dataFim) {
      const fim = parseISO(dataFim);
      return `${format(inicio, timeFormat)} - ${format(fim, timeFormat)}`;
    }
    
    return format(inicio, timeFormat);
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = parseISO(event.data_inicio);
      return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const getTodayEvents = () => {
    return filteredEvents.filter(event => isToday(parseISO(event.data_inicio)));
  };

  const getUpcomingEvents = () => {
    return filteredEvents.filter(event => {
      const eventDate = parseISO(event.data_inicio);
      return (isTomorrow(eventDate) || isThisWeek(eventDate)) && !isToday(eventDate);
    }).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie eventos, consultas e atividades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => {
            console.log("Botão Novo Evento clicado!");
            console.log("Estado atual showAddModal:", showAddModal);
            setShowAddModal(true);
            console.log("Estado após setShowAddModal(true):", true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTodayEvents().length}</div>
            <p className="text-xs text-muted-foreground">
              eventos agendados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUpcomingEvents().length}</div>
            <p className="text-xs text-muted-foreground">
              próximos eventos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              eventos cadastrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.status === 'agendado').length}
            </div>
            <p className="text-xs text-muted-foreground">
              aguardando execução
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {selectedStatus === "todos" ? "Todos" : selectedStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedStatus("todos")}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("agendado")}>
                  Agendado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("em_andamento")}>
                  Em Andamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("concluido")}>
                  Concluído
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("cancelado")}>
                  Cancelado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Tipo: {selectedType === "todos" ? "Todos" : selectedType}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedType("todos")}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("evento")}>
                  Evento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("consulta")}>
                  Consulta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("atividade")}>
                  Atividade
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("reuniao")}>
                  Reunião
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("terapia")}>
                  Terapia
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "calendar" | "list")}>
        <TabsList>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Calendário</CardTitle>
                <CardDescription>
                  Selecione uma data para ver os eventos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Events for Selected Date */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  Eventos para {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
                <CardDescription>
                  {getEventsForDate(selectedDate).length} evento(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum evento agendado para esta data</p>
                    </div>
                  ) : (
                    getEventsForDate(selectedDate).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div
                          className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: event.cor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{event.titulo}</h4>
                            <div className="flex items-center gap-2">
                              {getTypeBadge(event.tipo)}
                              {getStatusBadge(event.status)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatEventTime(event.data_inicio, event.data_fim, event.all_day)}
                            </div>
                            {event.local && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.local}
                              </div>
                            )}
                          </div>
                          {event.descricao && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {event.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Eventos</CardTitle>
              <CardDescription>
                Todos os eventos da agenda ({filteredEvents.length} encontrados)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Evento</TableHead>
                      <TableHead className="min-w-[120px]">Data/Hora</TableHead>
                      <TableHead className="min-w-[100px]">Tipo</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">Prioridade</TableHead>
                      <TableHead className="min-w-[150px] hidden md:table-cell">Local</TableHead>
                      <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            {searchTerm || selectedStatus !== "todos" || selectedType !== "todos"
                              ? "Nenhum evento encontrado com os filtros aplicados."
                              : "Nenhum evento cadastrado na agenda."}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEvents.map((event) => (
                        <TableRow key={event.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: event.cor }}
                              />
                              <div>
                                <div className="font-medium">{event.titulo}</div>
                                {event.descricao && (
                                  <div className="text-sm text-muted-foreground line-clamp-1">
                                    {event.descricao}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{format(parseISO(event.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</div>
                              <div className="text-muted-foreground">
                                {formatEventTime(event.data_inicio, event.data_fim, event.all_day)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(event.tipo)}</TableCell>
                          <TableCell>{getStatusBadge(event.status)}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {getPriorityBadge(event.prioridade)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {event.local && (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {event.local}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedEvent(event)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedEvent?.cor }}
              />
              {selectedEvent?.titulo}
            </DialogTitle>
            <DialogDescription>
              Detalhes do evento
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data/Hora</label>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(selectedEvent.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - {" "}
                    {formatEventTime(selectedEvent.data_inicio, selectedEvent.data_fim, selectedEvent.all_day)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedEvent.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <div className="mt-1">
                    {getTypeBadge(selectedEvent.tipo)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <div className="mt-1">
                    {getPriorityBadge(selectedEvent.prioridade)}
                  </div>
                </div>
              </div>
              
              {selectedEvent.local && (
                <div>
                  <label className="text-sm font-medium">Local</label>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedEvent.local}
                  </p>
                </div>
              )}
              
              {selectedEvent.descricao && (
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.descricao}</p>
                </div>
              )}
              
              {selectedEvent.observacoes && (
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.observacoes}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  Fechar
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Event Modal */}
      <AddEventModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={fetchEvents}
      />
    </div>
  );
};

export default AgendaPage;