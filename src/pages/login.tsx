import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/core/providers/AuthProvider";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export default function Login() {
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      await login(values);
      toast({
        title: "Authenticated Successfully",
        description: "Welcome to Form-Craft VCDP Reporting System.",
      });
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description:
          error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary text-primary-foreground text-4xl font-display font-bold shadow-2xl shadow-primary/30 mb-2">
            V
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">
              VCDP
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Financial Flows to Food Systems Tracker Tool (UN 3FS)
            </p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-2xl ring-1 ring-slate-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold">
              Authorized Access Only
            </CardTitle>
            <CardDescription className="font-medium">
              Enter secure credentials to manage VCDP records.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="coordinator@vcdp.gov.ng"
                          {...field}
                          className="h-12 px-4 bg-white/50 border-slate-200 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                        Secure Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="h-12 px-4 bg-white/50 border-slate-200 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] group"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  )}
                  Authorize Access
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" /> Encrypted end-to-end for audit
            compliance
          </p>
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-muted-foreground italic">
              &copy; 2026 International Fund for Agricultural Development (IFAD)
              VCDP System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
