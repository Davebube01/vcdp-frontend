import React, { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  useStates,
  useVcdpComponents,
  useThreefsComponents,
  useFundingSources,
  useCommodities,
  useFiscalYears,
  useValueChainSegments,
} from "@/core/services/loaders/meta-loaders";
import { useUpdateRecordAction } from "@/core/services/actions/record-actions";
import { useRecord } from "@/core/services/loaders/records-loaders";
import { useDocuments } from "@/core/services/loaders/documents-loaders";
import { useProjects } from "@/core/services/loaders/project-loaders";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, ChevronLeft, FileCheck, MapPin, Calculator, FileText, Users, DollarSign, CloudSun, History, CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  ref_id: z.string().min(1, "Ref ID is required"),
  project_name: z.string().min(1, "Project Name is required"),
  commodity: z.array(z.string()).min(1, "At least one commodity required"),
  fy_awarded: z.string().min(1, "FY Awarded is required"),
  fy_completed: z.string().min(1, "FY Completed is required"),
  programme_phase: z.string(),
  fiscal_quarter: z.string().min(1, "Fiscal Quarter is required"),
  vcdp_component: z.array(z.string()).min(1, "At least one VCDP Component is required"),
  vcdp_sub_components: z.array(z.string()).min(1, "At least one sub-component required"),
  state: z.string().min(1, "State is required"),
  lgas: z.array(z.string()).min(1, "At least one LGA required"),
  threeFS_primary: z.array(z.string()).min(1, "At least one 3FS Primary required"),
  threeFS_sub_components: z.array(z.string()),
  cofog_code: z.string().optional(),
  funding_sources: z.array(z.string()).min(1, "At least one funding source required"),
  sub_funding_sources: z.array(z.string()),
  expenditure_fgn: z.coerce.number(),
  expenditure_state: z.coerce.number(),
  expenditure_ifad: z.coerce.number(),
  expenditure_oof: z.coerce.number(),
  expenditure_beneficiary: z.coerce.number(),
  expenditure_other: z.coerce.number(),
  beneficiary_categories: z.array(z.string()),
  beneficiary_total: z.coerce.number(),
  beneficiary_male: z.coerce.number(),
  beneficiary_female: z.coerce.number(),
  beneficiary_youth_under35: z.coerce.number(),
  beneficiary_plwd: z.coerce.number(),
  value_chain_segments: z.array(z.string()),
  climate_flag: z.boolean(),
  data_source: z.array(z.string()).min(1, "At least one Data Source required"),
  supporting_documents: z.array(z.string()),
  classification_notes: z.string().max(200).optional(),
  status: z.enum(["PENDING", "REJECTED", "DRAFT", "PUBLISHED"]).optional(),
});

export default function EditRecord() {
  const { id } = useParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const isNationalAdmin = user?.role?.toUpperCase() === "NATIONAL_ADMIN";
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: record, isLoading: isRecordLoading } = useRecord(id || "");
  const updateRecordMutation = useUpdateRecordAction(id || "");

  const { data: states } = useStates();
  const { data: vcdpMeta } = useVcdpComponents();
  const { data: threeFsMeta } = useThreefsComponents();
  const { data: fundMeta } = useFundingSources();
  const { data: commodities } = useCommodities();
  const { data: fiscalYears } = useFiscalYears();
  const { data: valueChainSegments } = useValueChainSegments();
  const { data: projectsList } = useProjects();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      ref_id: "",
      project_name: "",
      commodity: [],
      fy_awarded: "",
      fy_completed: "",
      programme_phase: "",
      fiscal_quarter: "",
      vcdp_component: [],
      vcdp_sub_components: [],
      state: "",
      lgas: [],
      threeFS_primary: [],
      threeFS_sub_components: [],
      funding_sources: [],
      sub_funding_sources: [],
      expenditure_fgn: 0,
      expenditure_state: 0,
      expenditure_ifad: 0,
      expenditure_oof: 0,
      expenditure_beneficiary: 0,
      expenditure_other: 0,
      beneficiary_categories: [],
      beneficiary_total: 0,
      beneficiary_male: 0,
      beneficiary_female: 0,
      beneficiary_youth_under35: 0,
      beneficiary_plwd: 0,
      value_chain_segments: [],
      climate_flag: false,
      data_source: [],
      supporting_documents: [],
      classification_notes: "",
    },
  });

  useEffect(() => {
    if (record) {
      form.reset({
        ...record,
        fy_awarded: record.fy_awarded.toString(),
        fy_completed: record.fy_completed.toString(),
        climate_flag: record.climate_flag === "Yes",
      });
    }
  }, [record, form]);

  const watchedValues = useWatch({ control: form.control });

  const totalExpenditure = useMemo(() => {
    return (
      (Number(watchedValues.expenditure_fgn) || 0) +
      (Number(watchedValues.expenditure_state) || 0) +
      (Number(watchedValues.expenditure_ifad) || 0) +
      (Number(watchedValues.expenditure_oof) || 0) +
      (Number(watchedValues.expenditure_beneficiary) || 0) +
      (Number(watchedValues.expenditure_other) || 0)
    );
  }, [watchedValues]);

  const { data: allDocs } = useDocuments(watchedValues.state);
  const availableDocuments = useMemo(() => {
    if (!allDocs || !watchedValues.data_source || watchedValues.data_source.length === 0) return [];
    return allDocs
      .filter((doc: any) => watchedValues.data_source?.includes(doc.data_source))
      .map((doc: any) => doc.name);
  }, [allDocs, watchedValues.data_source]);

  const fieldLabels: Record<string, string> = {
    ref_id: "Project Reference Number",
    project_name: "Project Name",
    commodity: "Commodity Value Chain",
    fy_awarded: "Fiscal Year (Awarded)",
    fy_completed: "Fiscal Year (Completed)",
    fiscal_quarter: "Fiscal Quarter",
    vcdp_component: "VCDP Component",
    vcdp_sub_components: "VCDP Sub-Component(s)",
    state: "State",
    lgas: "LGAs",
    threeFS_primary: "3FS Component (Primary)",
    funding_sources: "Funding Source",
    data_source: "Data Source",
    beneficiary_total: "Total Headcount",
  };

  const onInvalid = (errors: any) => {
    const errorFields = Object.keys(errors);
    const labels = errorFields
      .map((key) => fieldLabels[key] || key)
      .join(", ");
    
    toast({
      title: "Missing Information",
      description: `Please check the following fields: ${labels}`,
      variant: "destructive",
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const t = Number(values.beneficiary_total) || 0;
      const m = Number(values.beneficiary_male) || 0;
      const f = Number(values.beneficiary_female) || 0;
      const y = Number(values.beneficiary_youth_under35) || 0;
      const p = Number(values.beneficiary_plwd) || 0;

      const payload = {
        ...values,
        fy_awarded: parseInt(values.fy_awarded),
        fy_completed: parseInt(values.fy_completed),
        climate_flag: values.climate_flag ? "Yes" : "No",
        // When resubmitted by coordinator, set status back to PENDING
        status: isNationalAdmin ? (values.status || "PUBLISHED") : "PENDING",
        beneficiary_male_percentage: t > 0 ? parseFloat(((m / t) * 100).toFixed(1)) : 0,
        beneficiary_female_percentage: t > 0 ? parseFloat(((f / t) * 100).toFixed(1)) : 0,
        beneficiary_youth_percentage: t > 0 ? parseFloat(((y / t) * 100).toFixed(1)) : 0,
        beneficiary_plwd: p,
      };

      await updateRecordMutation.mutateAsync(payload);
      toast({
        title: "Record Updated",
        description: isNationalAdmin ? "Changes saved successfully." : "Record resubmitted for approval.",
      });
      navigate(`/submissions/${id}`);
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "An error occurred while saving changes.",
        variant: "destructive",
      });
    }
  };

  if (isRecordLoading || isAuthLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 pb-32">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Edit Submission
            </h1>
            <p className="text-muted-foreground mt-1">
              Updating record for {record?.ref_id}
              {record?.status === "REJECTED" && (
                  <span className="ml-2 text-rose-600 font-bold">(Action Required)</span>
              )}
            </p>
          </div>
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
            <Card className="glass-card shadow-sm border-l-4 border-l-blue-500">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" /> Identification
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="ref_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Reference ID <span className="text-red-500">*</span></FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="project_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card className="glass-card shadow-sm border-l-4 border-l-emerald-500">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" /> Financials
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="expenditure_ifad"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IFAD Expenditure (USD)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="expenditure_fgn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>FGN Expenditure (USD)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="expenditure_state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State Expenditure (USD)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg flex justify-between items-center">
                        <span className="font-bold text-emerald-800">Total Expenditure</span>
                        <span className="text-xl font-bold text-emerald-700">${totalExpenditure.toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-card shadow-sm border-l-4 border-l-rose-500">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-rose-500" /> Beneficiaries
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="beneficiary_total"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total Headcount <span className="text-red-500">*</span></FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="beneficiary_youth_under35"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Youth Under 35</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="beneficiary_plwd"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>PLWD</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 z-50 flex justify-center">
                <div className="max-w-5xl w-full flex justify-between items-center gap-4">
                    <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <div className="flex gap-3">
                        {isNationalAdmin && record?.status === "PENDING" && (
                             <Button variant="secondary" type="button" onClick={() => onSubmit({...form.getValues(), status: "PUBLISHED"})}>
                                Quick Approve
                            </Button>
                        )}
                        <Button type="submit" size="lg" disabled={updateRecordMutation.isPending}>
                            {updateRecordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isNationalAdmin ? "Save Changes" : "Resubmit for Approval"}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
      </Form>
    </div>
  );
}
