import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useInsight } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const formSchema = z.object({
  department: z.enum(['Sales', 'Engineering', 'Marketing', 'Product', 'Support']),
  feature: z.enum(['Performance', 'UI/UX', 'Reliability', 'Features', 'Pricing']),
  nps: z.number().min(0).max(10),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative']),
  feedback: z.string().min(10, {
    message: "Feedback must be at least 10 characters.",
  }),
});

export default function ResponseForm() {
  const { addResponse } = useInsight();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nps: 5,
      feedback: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addResponse({
      ...values,
      date: new Date().toISOString().split('T')[0],
    });
    
    toast({
      title: "Response Submitted",
      description: "Thank you for your feedback!",
    });
    
    form.reset({
      nps: 5,
      feedback: "",
    });
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="mb-8 text-center space-y-2">
        <h2 className="text-3xl font-display font-bold">New Response</h2>
        <p className="text-muted-foreground">Manually enter a survey response into the system.</p>
      </div>

      <Card className="glass-card border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Feedback Details</CardTitle>
          <CardDescription>All fields are required for accurate analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Performance">Performance</SelectItem>
                          <SelectItem value="UI/UX">UI/UX</SelectItem>
                          <SelectItem value="Reliability">Reliability</SelectItem>
                          <SelectItem value="Features">Features</SelectItem>
                          <SelectItem value="Pricing">Pricing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NPS Score ({field.value})</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">0</span>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          defaultValue={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">10</span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      How likely is the user to recommend us?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sentiment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sentiment Analysis</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sentiment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Positive">Positive</SelectItem>
                        <SelectItem value="Neutral">Neutral</SelectItem>
                        <SelectItem value="Negative">Negative</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback Comments</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the customer's specific feedback here..."
                        className="resize-none min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/25">Submit Response</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
