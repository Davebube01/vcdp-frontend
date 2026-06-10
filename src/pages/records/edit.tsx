import React, { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { useInstitutions } from "@/core/services/loaders/institution-loaders";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader2, Save, ChevronLeft, FileCheck, MapPin, Calculator, FileText, Users, DollarSign, CloudSun, History, CheckCircle, ChevronsUpDown, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  ref_id: z.string().optional(),
  project_name: z.string().min(1, "Activity Name is required"),
  activity_name: z.string().optional(),
  activity_type_code: z.string().optional(),
  category_costcode: z.string().optional(),
  commodity: z.array(z.string()).min(1, "At least one commodity required"),
  fy_awarded: z.string().min(1, "FY Awarded is required"),
  fy_completed: z.string().min(1, "FY Completed is required"),
  programme_phase: z.string(),
  fiscal_quarter: z.array(z.string()).min(1, "At least one quarter required"),
  vcdp_component: z.array(z.string()).min(1, "At least one VCDP Component is required"),
  vcdp_sub_components: z.array(z.string()).min(1, "At least one sub-component required"),
  state: z.string().min(1, "State is required"),
  lgas: z.array(z.string()).min(1, "At least one LGA required"),
  threeFS_primary: z.array(z.string()).min(1, "At least one 3FS Primary required"),
  threeFS_sub_components: z.array(z.string()),
  cofog_divisions: z.array(z.string()).optional(),
  cofog_groups: z.array(z.string()).optional(),
  cofog_code: z.string().optional(),
  funding_sources: z.array(z.string()).min(1, "At least one funding source required"),
  sub_funding_sources: z.array(z.string()),
  sub_funding_oof_text: z.string().optional(),
  sub_funding_private_text: z.string().optional(),
  sub_funding_value_chain_text: z.string().optional(),
  expenditure_fgn: z.coerce.number().min(0),
  expenditure_state: z.coerce.number().min(0),
  expenditure_ifad: z.coerce.number().min(0).default(0),
  expenditure_ifad_loan: z.coerce.number().min(0).default(0),
  expenditure_ifad_grant: z.coerce.number().min(0).default(0),
  expenditure_oof: z.coerce.number().min(0).default(0),
  expenditure_beneficiary: z.coerce.number().min(0).default(0),
  expenditure_other: z.coerce.number().min(0).default(0),
  expenditure_private_sector: z.coerce.number().min(0).default(0),
  expenditure_value_chain: z.coerce.number().min(0).default(0),
  expenditure_total_reported: z.coerce.number().min(0).default(0),
  currency: z.enum(["USD", "NGN"]),
  beneficiary_categories: z.array(z.string()),
  beneficiary_total: z.coerce.number(),
  beneficiary_male: z.coerce.number(),
  beneficiary_female: z.coerce.number(),
  beneficiary_youth_under35: z.coerce.number(),
  beneficiary_plwd: z.coerce.number(),
  unit: z.string().min(1, "Unit is required"),
  quarterly_beneficiary_data: z.record(
    z.string(),
    z.object({
      total: z.number().default(0),
      male: z.number().default(0),
      female: z.number().default(0),
      youth: z.number().default(0),
      plwd: z.number().default(0),
    })
  ).optional(),
  value_chain_segments: z.array(z.string()),
  value_chain_segments_other: z.string().optional(),
  climate_flag: z.boolean(),
  data_source: z.array(z.string()).min(1, "At least one Data Source required"),
  supporting_documents: z.array(z.string()),
  classification_notes: z.string().max(200).optional(),
  executing_agency: z.string().min(1, "Institution Name is required"),
  institution_code: z.string().min(1, "Institution Code is required"),
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
  const { data: segments } = useValueChainSegments();
  const { data: projectsList } = useProjects();

  const initialValues = useMemo(() => {
    if (!record) return undefined;

    const ensureArray = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return [val].filter(Boolean); }
      }
      return val ? [val] : [];
    };

    const normalizedState = record.state?.trim();
    const matchedState = states?.find(s => s.name.toLowerCase() === normalizedState?.toLowerCase());

    return {
      ...record,
      fy_awarded: record.fy_awarded?.toString() || "",
      fy_completed: record.fy_completed?.toString() || "",
      fiscal_quarter: ensureArray(record.fiscal_quarter),
      commodity: ensureArray(record.commodity),
      vcdp_component: ensureArray(record.vcdp_component),
      vcdp_sub_components: ensureArray(record.vcdp_sub_components),
      lgas: ensureArray(record.lgas),
      threeFS_primary: ensureArray(record.threeFS_primary),
      threeFS_sub_components: ensureArray(record.threeFS_sub_components),
      funding_sources: ensureArray(record.funding_sources),
      sub_funding_sources: ensureArray(record.sub_funding_sources),
      value_chain_segments: ensureArray(record.value_chain_segments),
      data_source: ensureArray(record.data_source),
      supporting_documents: ensureArray(record.supporting_documents),
      beneficiary_categories: ensureArray(record.beneficiary_categories),
      cofog_divisions: ensureArray(record.cofog_divisions),
      cofog_groups: ensureArray(record.cofog_groups),
      climate_flag: record.climate_flag === "Yes",
      expenditure_fgn: record.expenditure_fgn || 0,
      expenditure_state: record.expenditure_state || 0,
      expenditure_ifad: record.expenditure_ifad || 0,
      expenditure_ifad_loan: record.expenditure_ifad_loan || 0,
      expenditure_ifad_grant: record.expenditure_ifad_grant || 0,
      expenditure_oof: record.expenditure_oof || 0,
      expenditure_beneficiary: record.expenditure_beneficiary || 0,
      expenditure_other: record.expenditure_other || 0,
      expenditure_private_sector: record.expenditure_private_sector || 0,
      expenditure_value_chain: record.expenditure_value_chain || 0,
      expenditure_total_reported: record.expenditure_total_reported || 0,
      beneficiary_total: record.beneficiary_total || 0,
      beneficiary_male: record.beneficiary_male || 0,
      beneficiary_female: record.beneficiary_female || 0,
      beneficiary_youth_under35: record.beneficiary_youth_under35 || 0,
      beneficiary_plwd: record.beneficiary_plwd || 0,
      quarterly_beneficiary_data: record.quarterly_beneficiary_data || {},
      unit: record.unit || "Person",
      institution_code: record.institution_code || "",
      executing_agency: record.executing_agency || "",
      activity_type_code: record.activity_type_code || "",
      currency: record.currency || "USD",
      status: record.status || "PENDING",
      state: matchedState?.name || normalizedState || "",
      cofog_code: record.cofog_code || "",
    };
  }, [record, states]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    values: initialValues,
    defaultValues: {
      ref_id: "",
      project_name: "",
      commodity: [],
      fy_awarded: "",
      fy_completed: "",
      programme_phase: "",
      fiscal_quarter: [],
      unit: "Person",
      vcdp_component: [],
      vcdp_sub_components: [],
      state: "",
      lgas: [],
      threeFS_primary: [],
      threeFS_sub_components: [],
      cofog_divisions: [],
      cofog_groups: [],
      funding_sources: [],
      sub_funding_sources: [],
      sub_funding_oof_text: "",
      sub_funding_private_text: "",
      sub_funding_value_chain_text: "",
      expenditure_fgn: 0,
      expenditure_state: 0,
      expenditure_ifad: 0,
      expenditure_ifad_loan: 0,
      expenditure_ifad_grant: 0,
      expenditure_oof: 0,
      expenditure_beneficiary: 0,
      expenditure_other: 0,
      expenditure_private_sector: 0,
      expenditure_value_chain: 0,
      expenditure_total_reported: 0,
      beneficiary_categories: [],
      beneficiary_total: 0,
      beneficiary_male: 0,
      beneficiary_female: 0,
      beneficiary_youth_under35: 0,
      beneficiary_plwd: 0,
      quarterly_beneficiary_data: {},
      value_chain_segments: [],
      value_chain_segments_other: "",
      climate_flag: false,
      data_source: [],
      supporting_documents: [],
      classification_notes: "",
      executing_agency: "",
      institution_code: "",
      activity_type_code: "",
      activity_name: "",
      category_costcode: "",
      currency: "USD",
      status: "PENDING",
      cofog_code: "",
    },
  });

  const watchedValues = useWatch({ control: form.control });

  const { data: institutionsList } = useInstitutions(watchedValues.state);

  // Logic: Programme Phase auto-fill
  useEffect(() => {
    const year = parseInt(watchedValues.fy_awarded || "0");
    if (year >= 2013 && year <= 2018) {
      form.setValue("programme_phase", "Original (2013-2018)");
    } else if (year >= 2019) {
      const currentPhase = form.getValues("programme_phase");
      if (currentPhase === "Original (2013-2018)") {
        form.setValue("programme_phase", "");
      }
    }
  }, [watchedValues.fy_awarded, form]);

  // Logic: Beneficiary Auto-population
  useEffect(() => {
    const total = Number(watchedValues.beneficiary_total) || 0;
    const male = Number(watchedValues.beneficiary_male) || 0;
    const female = Number(watchedValues.beneficiary_female) || 0;

    if (total > 0) {
      if (document.activeElement?.getAttribute("name") === "beneficiary_male") {
        const calculatedFemale = Math.max(0, total - male);
        if (female !== calculatedFemale) {
          form.setValue("beneficiary_female", calculatedFemale);
        }
      } else if (
        document.activeElement?.getAttribute("name") === "beneficiary_female"
      ) {
        const calculatedMale = Math.max(0, total - female);
        if (male !== calculatedMale) {
          form.setValue("beneficiary_male", calculatedMale);
        }
      }
    }
  }, [
    watchedValues.beneficiary_total,
    watchedValues.beneficiary_male,
    watchedValues.beneficiary_female,
    form,
  ]);

  const ifadTotal = useMemo(() => {
    return (Number(watchedValues.expenditure_ifad_loan) || 0) + (Number(watchedValues.expenditure_ifad_grant) || 0);
  }, [watchedValues.expenditure_ifad_loan, watchedValues.expenditure_ifad_grant]);

  const totalExpenditure = useMemo(() => {
    return (
      (Number(watchedValues.expenditure_fgn) || 0) +
      (Number(watchedValues.expenditure_state) || 0) +
      ifadTotal +
      (Number(watchedValues.expenditure_oof) || 0) +
      (Number(watchedValues.expenditure_beneficiary) || 0) +
      (Number(watchedValues.expenditure_private_sector) || 0) +
      (Number(watchedValues.expenditure_value_chain) || 0) +
      (Number(watchedValues.expenditure_other) || 0)
    );
  }, [watchedValues, ifadTotal]);

  const filteredLGAs = useMemo(() => {
    const selectedStateName = watchedValues.state;
    if (!selectedStateName) return [];

    const selectedState = states?.find(
      (s) => s.name.toLowerCase() === selectedStateName.toLowerCase(),
    );
    const lgas = selectedState?.lgas.map((l) => l.name) || [];
    return ["All LGAs", ...lgas];
  }, [watchedValues.state, states]);

  const filteredVcdpSubs = useMemo(() => {
    const selectedFilteredVcdpSubs = watchedValues.vcdp_component || []
    if (selectedFilteredVcdpSubs.length === 0) return []
    return selectedFilteredVcdpSubs.flatMap(
      (vcpdsubs) => (vcdpMeta as Record<string, string[]>)?.[vcpdsubs] || [],
    )
  }, [watchedValues.vcdp_component, vcdpMeta]);

  const { data: allDocs } = useDocuments(watchedValues.state);
  const availableDocuments = useMemo(() => {
    if (!allDocs || !watchedValues.data_source || watchedValues.data_source.length === 0) return [];
    return allDocs
      .filter((doc: any) => watchedValues.data_source?.includes(doc.data_source))
      .map((doc: any) => doc.name);
  }, [allDocs, watchedValues.data_source]);

  const filteredThreeFsSubs = useMemo(() => {
    const selectedPrimaries = watchedValues.threeFS_primary || [];
    if (selectedPrimaries.length === 0) return [];
    return selectedPrimaries.flatMap(
      (primary) => (threeFsMeta as Record<string, string[]>)?.[primary] || [],
    );
  }, [watchedValues.threeFS_primary, threeFsMeta]);

  // Climate flag: auto-force ON when Component 5 is selected
  const CLIMATE_COMPONENT = "Component 5: Climate Change and Natural Resources";
  const isClimateForced = (watchedValues.threeFS_primary || []).includes(CLIMATE_COMPONENT);

  useEffect(() => {
    if (isClimateForced) {
      form.setValue("climate_flag", true, { shouldDirty: true });
    }
  }, [isClimateForced, form]);

  const filteredSubFundingSources = useMemo(() => {
    const selectedFoundations = watchedValues.funding_sources || [];
    if (selectedFoundations.length === 0) return [];
    return selectedFoundations.flatMap(
      (source) => (fundMeta as Record<string, string[]>)?.[source] || [],
    );
  }, [watchedValues.funding_sources, fundMeta]);

  const cofogMeta: Record<string, string[]> = {
    "Economic Affairs": ["Agriculture, forestry, fishing and hunting"],
    "Environmental Protection": [
      "Waste management",
      "Pollution abatement",
      "Protection of biodiversity and landscape",
    ],
  };

  const filteredCofogGroups = useMemo(() => {
    const selectedDivisions = watchedValues.cofog_divisions || [];
    if (selectedDivisions.length === 0) return [];
    return selectedDivisions.flatMap((division) => cofogMeta[division] || []);
  }, [watchedValues.cofog_divisions]);

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
    if (totalExpenditure <= 0) {
      toast({
        title: "Validation Error",
        description: "Total expenditure must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: any = {
        ...values,
        fy_awarded: parseInt(values.fy_awarded),
        fy_completed: parseInt(values.fy_completed),
        climate_flag: values.climate_flag ? "Yes" : "No",
        expenditure_ifad: (Number(values.expenditure_ifad_loan) || 0) + (Number(values.expenditure_ifad_grant) || 0),
        status: isNationalAdmin ? (values.status || "PUBLISHED") : "PENDING",
      };

      // Aggregate quarterly data into top-level fields if not "All Quarters"
      if (!values.fiscal_quarter.includes("All Quarters") && values.quarterly_beneficiary_data) {
        let total = 0, male = 0, female = 0, youth = 0, plwd = 0;
        Object.values(values.quarterly_beneficiary_data).forEach((q: any) => {
          total += Number(q.total) || 0;
          male += Number(q.male) || 0;
          female += Number(q.female) || 0;
          youth += Number(q.youth) || 0;
          plwd += Number(q.plwd) || 0;
        });
        payload.beneficiary_total = total;
        payload.beneficiary_male = male;
        payload.beneficiary_female = female;
        payload.beneficiary_youth_under35 = youth;
        payload.beneficiary_plwd = plwd;
      }

      const t = Number(payload.beneficiary_total) || 0;
      const m = Number(payload.beneficiary_male) || 0;
      const f = Number(payload.beneficiary_female) || 0;
      const y = Number(payload.beneficiary_youth_under35) || 0;
      
      if (t > 0) {
        payload.beneficiary_male_percentage = parseFloat(((m / t) * 100).toFixed(1));
        payload.beneficiary_female_percentage = parseFloat(((f / t) * 100).toFixed(1));
        payload.beneficiary_youth_percentage = parseFloat(((y / t) * 100).toFixed(1));
      }

      await updateRecordMutation.mutateAsync(payload);
      toast({
        title: "Record Updated",
        description: isNationalAdmin ? "Changes saved successfully." : "Record resubmitted for approval.",
      });
      navigate(`/activities/${id}`);
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "An error occurred while saving changes.",
        variant: "destructive",
      });
    }
  };

  if (isRecordLoading || isAuthLoading || !record || !states) {
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
            {/* SECTION 1: Identifiers */}
            <Card className="glass-card shadow-sm border-l-4 border-l-blue-500 relative z-50">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" /> Project Identification
                    </CardTitle>
                    <CardDescription>Core identifiers for the VCDP transaction.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="ref_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transaction ID / Ref</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. VCDP/INV/001" {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="activity_type_code"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Activity Type/Code <span className="text-red-500">*</span></FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between bg-white text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value
                                                        ? projectsList?.find((p) => p.activity_type_code === field.value)?.activity_type_code || field.value
                                                        : "Search Activity Code/Name"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search activity code or name..." />
                                                <CommandList>
                                                    <CommandEmpty>No activity found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {projectsList?.map((p) => (
                                                            <CommandItem
                                                                value={`${p.activity_type_code} ${p.name}`}
                                                                key={p.id}
                                                                onSelect={() => {
                                                                    form.setValue("activity_type_code", p.activity_type_code);
                                                                    form.setValue("project_name", p.name);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        p.activity_type_code === field.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <span className="font-mono font-bold mr-2">{p.activity_type_code}</span> - {p.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="project_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Activity Name <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Activity Name" {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="activity_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Activity Name (Short)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Market linkages facilitation" {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category_costcode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category / Costcode</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Training, technical assistance..." {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 2: Context & Timing */}
            <Card className="glass-card shadow-sm border-l-4 border-l-amber-500 relative z-40">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <History className="w-5 h-5 text-amber-500" /> Context & Timing
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="fy_awarded"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fiscal Year (Awarded) <span className="text-red-500">*</span></FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {fiscalYears?.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fy_completed"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fiscal Year (Completed) <span className="text-red-500">*</span></FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {fiscalYears?.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="programme_phase"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Programme Phase</FormLabel>
                                <FormControl><Input {...field} disabled /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fiscal_quarter"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fiscal Quarter <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={["Q1", "Q2", "Q3", "Q4", "All Quarters"]}
                                        selected={field.value}
                                        onChange={(vals) => {
                                            if (vals.includes("All Quarters")) {
                                                const previouslyAll = field.value.includes("All Quarters");
                                                if (!previouslyAll) {
                                                    field.onChange(["All Quarters"]);
                                                } else {
                                                    const withoutAll = vals.filter(v => v !== "All Quarters");
                                                    if (withoutAll.length > 0) {
                                                        field.onChange(withoutAll);
                                                    } else {
                                                        field.onChange(["All Quarters"]);
                                                    }
                                                }
                                            } else {
                                                field.onChange(vals);
                                            }
                                        }}
                                        placeholder="Select Quarter(s)"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="commodity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Commodity Value Chain <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={commodities || []}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Commodities"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* SECTION 3: Project Framework */}
            <Card className="glass-card shadow-sm border-l-4 border-l-purple-500 relative z-30">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-purple-500" /> Project Framework
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="vcdp_component"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>VCDP Component <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={Object.keys(vcdpMeta || {})}
                                        selected={field.value}
                                        onChange={(vals) => {
                                            field.onChange(vals);
                                            form.setValue("vcdp_sub_components", []);
                                        }}
                                        placeholder="Select Components"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="vcdp_sub_components"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>VCDP Sub-Component(s) <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={filteredVcdpSubs}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Sub-Components"
                                        disabled={!watchedValues.vcdp_component?.length}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* SECTION 4: International Standard (3FS & COFOG) */}
            <Card className="glass-card shadow-sm border-l-4 border-l-cyan-500 relative z-20">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-cyan-500" /> International Standard Classification
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="threeFS_primary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>3FS Component (Primary) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={Object.keys(threeFsMeta || {})}
                                            selected={field.value}
                                            onChange={(vals) => {
                                                field.onChange(vals);
                                                form.setValue("threeFS_sub_components", []);
                                            }}
                                            placeholder="Select 3FS Components"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="threeFS_sub_components"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>3FS Sub-Component(s)</FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={filteredThreeFsSubs}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select 3FS Sub-Components"
                                            disabled={!watchedValues.threeFS_primary?.length}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="cofog_divisions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>COFOG Division(s)</FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={Object.keys(cofogMeta)}
                                            selected={field.value || []}
                                            onChange={(vals) => {
                                                field.onChange(vals);
                                                form.setValue("cofog_groups", []);
                                            }}
                                            placeholder="Select COFOG Divisions"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cofog_groups"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>COFOG Group(s)</FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={filteredCofogGroups}
                                            selected={field.value || []}
                                            onChange={field.onChange}
                                            placeholder="Select COFOG Groups"
                                            disabled={!watchedValues.cofog_divisions?.length}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-card shadow-sm border-l-4 border-l-orange-500">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-orange-500" /> Location & Agency
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                                <Select
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        form.setValue("lgas", []);
                                        form.setValue("executing_agency", "");
                                    }}
                                    value={field.value}
                                    disabled={!isNationalAdmin}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select State" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {states?.map((s) => (
                                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="executing_agency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Institution / Executing Agency</FormLabel>
                                <Select
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        const inst = institutionsList?.find(i => i.name === val);
                                        if (inst) form.setValue("institution_code", inst.code);
                                    }}
                                    value={field.value}
                                    disabled={!watchedValues.state}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={watchedValues.state ? "Select Institution" : "Select state first"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {institutionsList?.map((inst) => (
                                            <SelectItem key={inst.id} value={inst.name}>
                                                {inst.code} - {inst.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="institution_code"
                        render={({ field }) => (
                            <FormItem className="hidden">
                                <FormControl>
                                    <Input {...field} type="hidden" />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lgas"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>LGAs <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={filteredLGAs}
                                        selected={field.value}
                                        onChange={(vals) => {
                                            if (vals.includes("All LGAs")) {
                                                const previouslyAll = field.value.includes("All LGAs");
                                                if (!previouslyAll) {
                                                    field.onChange(["All LGAs"]);
                                                } else {
                                                    const withoutAll = vals.filter(v => v !== "All LGAs");
                                                    if (withoutAll.length > 0) {
                                                        field.onChange(withoutAll);
                                                    } else {
                                                        field.onChange(["All LGAs"]);
                                                    }
                                                }
                                            } else {
                                                field.onChange(vals);
                                            }
                                        }}
                                        placeholder="Select LGAs"
                                        disabled={!watchedValues.state}
                                    />
                                </FormControl>
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
                <CardContent className="pt-8">
                    <div className="flex flex-col md:flex-row gap-6 mb-8 p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className="flex items-center gap-2 font-bold text-foreground">
                                        Input Currency
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Select Currency" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                            <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-8 mb-8">
                        {/* Group 1: IFAD Financing */}
                        <div className="p-6 rounded-xl bg-blue-50/50 border border-blue-100">
                            <h4 className="text-sm font-bold uppercase text-blue-700 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                IFAD Financing ({watchedValues.currency})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <FormField
                                    control={form.control}
                                    name="expenditure_ifad_loan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IFAD Loan ({watchedValues.currency})</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expenditure_ifad_grant"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IFAD Grant ({watchedValues.currency})</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="p-3 bg-white rounded-lg border border-blue-200 flex justify-between items-center h-10">
                                    <span className="text-xs font-bold text-blue-600">Total IFAD:</span>
                                    <span className="font-display font-bold text-blue-700">
                                        {watchedValues.currency === "NGN" ? "₦" : "$"}
                                        {ifadTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Group 2: Government & Community */}
                        <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-100">
                            <h4 className="text-sm font-bold uppercase text-emerald-700 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                Government & Community Contributions
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="expenditure_fgn"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>FGN Budget ({watchedValues.currency})</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expenditure_state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>State/LGA ({watchedValues.currency})</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expenditure_beneficiary"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Beneficiary ({watchedValues.currency})</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Group 3: Special & Private Financing */}
                        <div className="p-6 rounded-xl bg-purple-50/50 border border-purple-100">
                            <h4 className="text-sm font-bold uppercase text-purple-700 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                Special & Private Financing
                            </h4>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <FormField
                                        control={form.control}
                                        name="expenditure_oof"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>IFAD OOF (USD)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                            field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sub_funding_oof_text"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>OOF Description (Free Text)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Details about OOF..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <FormField
                                        control={form.control}
                                        name="expenditure_private_sector"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Private Sector Financing (USD)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                            field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sub_funding_private_text"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Private Sector Details (Free Text)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Company name, sector, etc..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <FormField
                                        control={form.control}
                                        name="expenditure_value_chain"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Value Chain Financing (USD)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                            field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sub_funding_value_chain_text"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Value Chain Details (Free Text)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Specific segment or activity..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-xl flex justify-between items-center text-white shadow-lg">
                        <span className="font-bold uppercase tracking-wider text-sm">Total Expenditure</span>
                        <span className="text-2xl font-display font-bold">${totalExpenditure.toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>
            <Card className="glass-card shadow-sm border-l-4 border-l-indigo-500">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-indigo-500" /> Value Chain & Data Sources
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 overflow-visible">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="value_chain_segments"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Value Chain Segment(s)</FormLabel>
                                        <FormControl>
                                            <MultiSelect
                                                options={segments || []}
                                                selected={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {watchedValues.value_chain_segments?.includes("Others") && (
                                <FormField
                                    control={form.control}
                                    name="value_chain_segments_other"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Other Value Chain Segment(s)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Specify other segments..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                        <FormField
                            control={form.control}
                            name="data_source"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data Source</FormLabel>
                                    <MultiSelect
                                        options={[
                                            "Administrative documents (HR reports, training reports, etc.)",
                                            "Audit documents (Internal audit reports, etc.)",
                                            "Financial documents (Bank statements, invoices, SEOs, etc.)",
                                            "Procurement files: Goods",
                                            "Procurement files: Works",
                                            "Procurement files: Consulting services",
                                            "Inventory documents (Assets registers, etc.)",
                                            "M&E documents (AWPB, studies, reports, mission reports, etc.)",
                                            "Correspondence",
                                            "Beneficiary data",
                                            "Technical reports",
                                            "Annual reports",
                                            "Geographic/location data",
                                        ]}
                                        selected={field.value || []}
                                        onChange={field.onChange}
                                        placeholder="Select Source(s)"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-card shadow-sm border-l-4 border-l-rose-500 z-10">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-rose-500" /> Beneficiary Data
                    </CardTitle>
                    <CardDescription>
                        Breakdown of beneficiaries or quantities per selected quarter.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit of Measurement <span className="text-red-500">*</span></FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Unit" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {["Person", "Number", "Ha", "Km", "Kg", "Centres"].map((u) => (
                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="beneficiary_categories"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Beneficiary Categories</FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={[
                                                "Farmers",
                                                "Processors",
                                                "Traders",
                                                "Input Supplier",
                                                "Service Providers or Infrastructure Developer",
                                                "Farmer Organizations",
                                            ]}
                                            selected={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {watchedValues.fiscal_quarter?.length === 0 ? (
                        <div className="p-8 border-2 border-dashed rounded-xl text-center text-muted-foreground bg-slate-50">
                            Please select at least one Fiscal Quarter in Context & Timing to enter beneficiary data.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {watchedValues.fiscal_quarter?.map((quarter) => (
                                <div key={quarter} className="p-6 border rounded-xl bg-slate-50/50 space-y-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                                    <h4 className="font-bold text-rose-700 flex items-center gap-2">
                                        {quarter === "All Quarters" ? "Cumulative Total" : `Quarterly Data: ${quarter}`}
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <FormField
                                            control={form.control}
                                            name={quarter === "All Quarters" || watchedValues.fiscal_quarter?.length === 1 ? "beneficiary_total" : `quarterly_beneficiary_data.${quarter}.total` as any}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{watchedValues.unit === "Person" ? "Total Headcount" : "Total Quantity"} <span className="text-red-500">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                                field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {watchedValues.unit === "Person" && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name={quarter === "All Quarters" || watchedValues.fiscal_quarter?.length === 1 ? "beneficiary_male" : `quarterly_beneficiary_data.${quarter}.male` as any}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Male</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={quarter === "All Quarters" || watchedValues.fiscal_quarter?.length === 1 ? "beneficiary_female" : `quarterly_beneficiary_data.${quarter}.female` as any}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Female</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={quarter === "All Quarters" || watchedValues.fiscal_quarter?.length === 1 ? "beneficiary_youth_under35" : `quarterly_beneficiary_data.${quarter}.youth` as any}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Youth (Under 35)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={quarter === "All Quarters" || watchedValues.fiscal_quarter?.length === 1 ? "beneficiary_plwd" : `quarterly_beneficiary_data.${quarter}.plwd` as any}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>PLWD</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        const cleanVal = val.replace(/^0+(?=[1-9])/, "");
                                                                        field.onChange(cleanVal === "" ? "" : Number(cleanVal));
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="glass-card shadow-sm border-l-4 border-l-gray-400">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-gray-500" /> Finalization & Logistics
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="climate_flag"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-emerald-50/50">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base font-bold text-emerald-800">
                                            Climate/Environment Flag
                                            {isClimateForced && (
                                                <span className="ml-2 text-xs font-semibold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                                                    Auto-enabled
                                                </span>
                                            )}
                                        </FormLabel>
                                        <FormDescription>
                                            {isClimateForced
                                                ? "Automatically enabled because Component 5 (Climate Change & Natural Resources) is selected."
                                                : "Does this project support climate adaptation, mitigation, or environmental sustainability activities?"}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isClimateForced}
                                            className="data-[state=checked]:bg-emerald-600"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="supporting_documents"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Supporting Documents</FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={availableDocuments}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select Documents"
                                            disabled={!watchedValues.state || !watchedValues.data_source?.length}
                                        />
                                    </FormControl>
                                    <FormDescription>Only documents matching the selected data sources are shown.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="classification_notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Classification Notes</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Add any internal classification notes here..." 
                                        className="min-h-[100px]"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormDescription>
                                    {watchedValues.classification_notes?.split(/\s+/).filter(Boolean).length || 0}/30 words
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {isNationalAdmin && (
                <Card className="glass-card shadow-sm border-l-4 border-l-slate-400">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-500" /> Publication Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PUBLISHED">Published (Live on Dashboard)</SelectItem>
                                            <SelectItem value="DRAFT">Draft (Hidden from Dashboard)</SelectItem>
                                            <SelectItem value="REJECTED">Rejected (Needs Correction)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            )}

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
