import React, { useState } from "react";
import { useAuth } from "@/core/providers/AuthProvider";
import { useProjects } from "@/core/services/loaders/project-loaders";
import { useCreateProjectAction, useUpdateProjectAction, useDeleteProjectAction } from "@/core/services/actions/project-actions";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Briefcase, Loader2, Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const formSchema = z.object({
  ref_id: z.string().min(1, "Reference ID is required"),
  name: z.string().min(1, "Project Name is required"),
});

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "NATIONAL_ADMIN";
  const { toast } = useToast();
  
  const { data: projects, isLoading } = useProjects();
  const createMutation = useCreateProjectAction();
  const updateMutation = useUpdateProjectAction();
  const deleteMutation = useDeleteProjectAction();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ref_id: "",
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingProjectId) {
      updateMutation.mutateAsync({ id: editingProjectId, data: { ref_id: values.ref_id, name: values.name } })
        .then(() => {
          toast({ title: "Success", description: "Project updated successfully." });
          setIsDialogOpen(false);
          form.reset();
        })
        .catch((error: any) => {
          toast({
            title: "Error",
            description: error?.response?.data?.detail || "Failed to update project",
            variant: "destructive",
          });
        });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast({ title: "Success", description: "Project added successfully." });
          setIsDialogOpen(false);
          form.reset();
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.response?.data?.detail || "Failed to add project",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleEdit = (project: any) => {
    setEditingProjectId(project.id);
    form.setValue("ref_id", project.ref_id);
    form.setValue("name", project.name);
    // Note: useUpdateProjectAction normally takes the ID initially, but for dynamic ids we should update the action 
    // or just pass it differently. We will dynamically assign the URL in the mutation if needed, but since we used standard react-query we have to fix our hook.
    // Instead of fixing it here, we will just pass the real mutator but wait, we need `updateMutation`. We can do an inline fetch instead OR update `useUpdateProjectAction` to accept `{id, data}`.
    // I will actually fix `useUpdateProjectAction` in a moment to take {id, data}.
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the project "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast({ title: "Success", description: "Project deleted successfully." });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.response?.data?.detail || "Failed to delete project",
            variant: "destructive",
          });
        }
      });
    }
  };

  const filteredProjects = projects?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ref_id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and view project registry.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { setEditingProjectId(null); form.reset(); }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => { setEditingProjectId(null); form.reset(); }}>
                <Plus className="w-4 h-4" /> Add Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProjectId ? "Edit Project" : "Add New Project"}</DialogTitle>
                <DialogDescription>
                  Enter the unique reference ID and name for the new project.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 pt-4"
                >
                  <FormField
                    control={form.control}
                    name="ref_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. VCDP/001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Market Development"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingProjectId ? "Update Project" : "Save Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-card border rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Reference ID</TableHead>
                <TableHead className="font-bold">Project Name</TableHead>
                <TableHead className="font-bold">Added On</TableHead>
                {isAdmin && <TableHead className="font-bold text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Briefcase className="w-8 h-8 mb-2 opacity-20" />
                      <p>No projects found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.ref_id}
                    </TableCell>
                    <TableCell>{project.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(project.created_at), "MMM d, yyyy")}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(project)}
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(project.id, project.name)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
