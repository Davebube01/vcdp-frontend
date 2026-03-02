import React from "react";
import { useUsers } from "@/core/services/loaders/user-loaders";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  UserPlus,
  Users as UsersIcon,
  Shield,
  Mail,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import Papa from "papaparse";
import { useCreateUser } from "@/core/services/loaders/user-loaders";

export default function Users() {
  const { data: users, isLoading } = useUsers();
  const { mutateAsync: createUser, isPending } = useCreateUser();
  const [showPassword, setShowPassword] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("single");

  // Single User Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "state_coordinator",
    state: "",
    is_active: "true",
  });

  // Bulk Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.role
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (formData.role === "state_coordinator" && !formData.state) {
      toast.error("State is required for State Coordinators.");
      return;
    }

    try {
      await createUser({
        ...formData,
        role: formData.role.toUpperCase(),
        is_active: formData.is_active === "true",
      });
      toast.success("User created successfully");
      setIsOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "state_coordinator",
        state: "",
        is_active: "true",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create user.");
    }
  };

  const handleBulkSubmit = async () => {
    if (!file) {
      toast.error("Please select a CSV file first.");
      return;
    }

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        if (!rows || rows.length === 0) {
          toast.error("The uploaded CSV file is empty");
          setIsUploading(false);
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const row of rows) {
          try {
            await createUser({
              name: row.name,
              email: row.email,
              password: "Password123!", // Default password for bulk upload
              role: (row.role || "state_coordinator").toUpperCase(),
              state: row.state || null,
              is_active: true,
            });
            successCount++;
          } catch (error) {
            errorCount++;
            console.error("Failed to create user from row:", row, error);
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully uploaded ${successCount} users.`);
          setIsOpen(false);
          setFile(null);
        }
        if (errorCount > 0) {
          toast.error(
            `Failed to upload ${errorCount} users. Check the console for details.`,
          );
        }
        setIsUploading(false);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
        setIsUploading(false);
      },
    });
  };

  const downloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,name,email,role,state\nJohn Doe,john@example.com,state_coordinator,Lagos\nJane Smith,jane@admin.com,national_admin,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "user_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            User Management
          </h2>
          <p className="text-muted-foreground mt-1 font-medium">
            Manage system access for National and Regional VCDP coordinators.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 h-11 px-6">
              <UserPlus className="h-5 w-5" /> Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-display font-bold">
                Add New User
              </DialogTitle>
              <DialogDescription>
                Create a new user account or upload multiple users via CSV.
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single User</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4 mt-4">
                <form
                  onSubmit={handleSingleSubmit}
                  className="space-y-4 text-left"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a secure password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-6 cursor-pointer text-gray-500"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({ ...formData, role: value })
                        }
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="state_coordinator">
                            State Coordinator
                          </SelectItem>
                          <SelectItem value="national_admin">
                            National Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.is_active}
                        onValueChange={(value) =>
                          setFormData({ ...formData, is_active: value })
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formData.role === "state_coordinator" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <Label htmlFor="state">Assigned State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) =>
                          setFormData({ ...formData, state: value })
                        }
                      >
                        <SelectTrigger id="state">
                          <SelectValue placeholder="Select expected state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Anambra">Anambra</SelectItem>
                          <SelectItem value="Benue">Benue</SelectItem>
                          <SelectItem value="Ebonyi">Ebonyi</SelectItem>
                          <SelectItem value="Enugu">Enugu</SelectItem>
                          <SelectItem value="Kogi">Kogi</SelectItem>
                          <SelectItem value="Nasarawa">Nasarawa</SelectItem>
                          <SelectItem value="Niger">Niger</SelectItem>
                          <SelectItem value="Ogun">Ogun</SelectItem>
                          <SelectItem value="Taraba">Taraba</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="pt-4 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Creating..." : "Create User"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-4 mt-4">
                <div className="bg-muted/30 border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Upload CSV File
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                      Download the template, fill in the user details, and
                      upload the CSV file here.
                    </p>
                  </div>

                  <div className="flex w-full items-center gap-2 mt-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="cursor-pointer file:cursor-pointer file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-4 file:py-1 hover:file:bg-primary/90"
                    />
                  </div>

                  {file && (
                    <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                      Selected: {file.name}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold mt-2"
                    onClick={downloadTemplate}
                    type="button"
                  >
                    Download Template
                  </Button>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkSubmit}
                    disabled={!file || isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload Users"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card shadow-sm border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary" /> Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {users?.length || 0}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Authorized system accounts
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" /> National Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {users?.filter((u) => u.role.toUpperCase() === "NATIONAL_ADMIN")
                .length || 0}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Cross-state visibility
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" /> State Coordinators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {users?.filter(
                (u) => u.role.toUpperCase() === "STATE_COORDINATOR",
              ).length || 0}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Restricted to implementation states
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg font-bold">
            Authorized Personnel
          </CardTitle>
          <CardDescription>
            System users with access to transaction data entry and reporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="font-bold uppercase text-[10px]">
                  User Profile
                </TableHead>
                <TableHead className="font-bold uppercase text-[10px]">
                  Primary Role
                </TableHead>
                <TableHead className="font-bold uppercase text-[10px]">
                  Assigned State
                </TableHead>
                <TableHead className="font-bold uppercase text-[10px]">
                  Account Status
                </TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px]">
                  Operations
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell>
                        <div className="h-10 w-40 bg-muted rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-24 bg-muted rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-20 bg-muted rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-20 bg-muted rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-16 bg-muted rounded float-right" />
                      </TableCell>
                    </TableRow>
                  ))
                : users?.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/5 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border shadow-sm">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                            />
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">
                              {user.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-bold uppercase text-[10px] border-slate-200 bg-slate-50"
                        >
                          {user.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.state ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700">
                            <MapPin className="w-3 h-3" /> {user.state}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Global Access
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_active ? "outline" : "secondary"}
                          className={
                            user.is_active
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"
                              : "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                          }
                        >
                          {user.is_active ? "ACTIVE" : "DISABLED"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-bold text-xs uppercase hover:bg-primary/5 hover:text-primary"
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
