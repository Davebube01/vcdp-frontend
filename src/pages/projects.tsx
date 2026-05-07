import React, { useState } from "react";
import { useAuth } from "@/core/providers/AuthProvider";
import { useProjects } from "@/core/services/loaders/project-loaders";
import { useCreateProjectAction, useUpdateProjectAction, useDeleteProjectAction } from "@/core/services/actions/project-actions";
import { useInstitutions } from "@/core/services/loaders/institution-loaders";
import { useCreateInstitutionAction, useUpdateInstitutionAction, useDeleteInstitutionAction } from "@/core/services/actions/institution-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Briefcase, Loader2, Plus, Search, Edit2, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { STATES } from "@/core/services/loaders/meta-loaders";

const projectFormSchema = z.object({
  activity_type_code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Activity Name is required"),
  vcdp_component: z.string().optional(),
});

const institutionFormSchema = z.object({
  state: z.string().min(1, "State is required"),
  code: z.string().min(1, "Acronym/Code is required"),
  name: z.string().min(1, "Full Name is required"),
});

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "NATIONAL_ADMIN";
  const { toast } = useToast();
  
  // Projects Data
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const createProject = useCreateProjectAction();
  const updateProject = useUpdateProjectAction();
  const deleteProject = useDeleteProjectAction();
  
  // Institutions Data
  const { data: institutions, isLoading: institutionsLoading } = useInstitutions();
  const createInstitution = useCreateInstitutionAction();
  const updateInstitution = useUpdateInstitutionAction();
  const deleteInstitution = useDeleteInstitutionAction();
  
  const [activeTab, setActiveTab] = useState("activities");
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isInstDialogOpen, setIsInstDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const projectForm = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { activity_type_code: "", name: "", vcdp_component: "" },
  });

  const instForm = useForm<z.infer<typeof institutionFormSchema>>({
    resolver: zodResolver(institutionFormSchema),
    defaultValues: { state: "", code: "", name: "" },
  });

  const onProjectSubmit = (values: z.infer<typeof projectFormSchema>) => {
    if (editingId) {
      updateProject.mutateAsync({ id: editingId, data: values })
        .then(() => {
          setIsProjectDialogOpen(false);
          projectForm.reset();
        });
    } else {
      createProject.mutate(values, {
        onSuccess: () => {
          setIsProjectDialogOpen(false);
          projectForm.reset();
        }
      });
    }
  };

  const onInstSubmit = (values: z.infer<typeof institutionFormSchema>) => {
    if (editingId) {
      updateInstitution.mutateAsync({ id: editingId, ...values })
        .then(() => {
          setIsInstDialogOpen(false);
          instForm.reset();
        });
    } else {
      createInstitution.mutate(values, {
        onSuccess: () => {
          setIsInstDialogOpen(false);
          instForm.reset();
        }
      });
    }
  };

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.activity_type_code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredInstitutions = institutions?.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.state.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Project Framework
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage activity types and responsible institutions.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50 p-1">
          <TabsTrigger value="activities" className="gap-2">
            <Briefcase className="w-4 h-4" /> Activity Types
          </TabsTrigger>
          <TabsTrigger value="institutions" className="gap-2">
            <Building2 className="w-4 h-4" /> Institutions
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                className="pl-9 h-10 bg-card"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {isAdmin && (
              activeTab === "activities" ? (
                <Dialog open={isProjectDialogOpen} onOpenChange={(open) => {
                  setIsProjectDialogOpen(open);
                  if (!open) { setEditingId(null); projectForm.reset(); }
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                      <Plus className="w-4 h-4" /> Add Activity Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Edit Activity Type" : "New Activity Type"}</DialogTitle>
                      <DialogDescription>Define the name and code for this project activity.</DialogDescription>
                    </DialogHeader>
                    <Form {...projectForm}>
                      <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4 pt-4">
                        <FormField
                          control={projectForm.control}
                          name="activity_type_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Activity Type Code</FormLabel>
                              <FormControl><Input placeholder="e.g. 1.1.1.1" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={projectForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Activity Name</FormLabel>
                              <FormControl><Input placeholder="e.g. Support to Value Addition" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={projectForm.control}
                          name="vcdp_component"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VCDP Component (Optional)</FormLabel>
                              <FormControl><Input placeholder="e.g. Component 1" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={createProject.isPending || updateProject.isPending}>
                          {(createProject.isPending || updateProject.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {editingId ? "Update" : "Save"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog open={isInstDialogOpen} onOpenChange={(open) => {
                  setIsInstDialogOpen(open);
                  if (!open) { setEditingId(null); instForm.reset(); }
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                      <Plus className="w-4 h-4" /> Add Institution
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Edit Institution" : "New Institution"}</DialogTitle>
                      <DialogDescription>Link an acronym and full name to a specific state.</DialogDescription>
                    </DialogHeader>
                    <Form {...instForm}>
                      <form onSubmit={instForm.handleSubmit(onInstSubmit)} className="space-y-4 pt-4">
                        <FormField
                          control={instForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select State" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={instForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Acronym / Code</FormLabel>
                              <FormControl><Input placeholder="e.g. SPMU" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={instForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Institution Name</FormLabel>
                              <FormControl><Input placeholder="e.g. State Programme Management Unit" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={createInstitution.isPending || updateInstitution.isPending}>
                          {(createInstitution.isPending || updateInstitution.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {editingId ? "Update" : "Save"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )
            )}
          </div>

          <TabsContent value="activities" className="m-0">
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-32 font-bold">Code</TableHead>
                    <TableHead className="font-bold">Activity Name</TableHead>
                    <TableHead className="font-bold">Component</TableHead>
                    <TableHead className="font-bold">Added On</TableHead>
                    {isAdmin && <TableHead className="text-right font-bold">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectsLoading ? (
                    <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : filteredProjects.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground">No activities found.</TableCell></TableRow>
                  ) : (
                    filteredProjects.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs font-bold text-primary">{p.activity_type_code}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.vcdp_component || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                setEditingId(p.id);
                                projectForm.setValue("activity_type_code", p.activity_type_code);
                                projectForm.setValue("name", p.name);
                                projectForm.setValue("vcdp_component", p.vcdp_component || "");
                                setIsProjectDialogOpen(true);
                              }}><Edit2 className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => {
                                if (confirm("Delete this activity?")) deleteProject.mutate(p.id);
                              }}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="institutions" className="m-0">
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-32 font-bold">State</TableHead>
                    <TableHead className="w-32 font-bold">Acronym</TableHead>
                    <TableHead className="font-bold">Full Name</TableHead>
                    {isAdmin && <TableHead className="text-right font-bold">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutionsLoading ? (
                    <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : filteredInstitutions.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground">No institutions found.</TableCell></TableRow>
                  ) : (
                    filteredInstitutions.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-bold text-xs">{i.state}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-primary">{i.code}</TableCell>
                        <TableCell className="font-medium">{i.name}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                setEditingId(i.id);
                                instForm.setValue("state", i.state);
                                instForm.setValue("code", i.code);
                                instForm.setValue("name", i.name);
                                setIsInstDialogOpen(true);
                              }}><Edit2 className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => {
                                if (confirm("Delete this institution?")) deleteInstitution.mutate(i.id);
                              }}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
