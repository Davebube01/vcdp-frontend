import React, { useRef } from 'react';
import { useInsight, Response } from '@/lib/store';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Upload, Trash2, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Responses() {
  const { responses, importResponses, clearResponses } = useInsight();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const csv = Papa.unparse(responses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `responses_export_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `${responses.length} rows exported to CSV.`,
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Basic validation - check if required keys exist in first row
        if (results.data.length > 0 && 'nps' in (results.data[0] as any)) {
           // Cast types properly
           const parsedData = (results.data as any[]).map((row, idx) => ({
             ...row,
             id: row.id || `import-${Date.now()}-${idx}`,
             nps: Number(row.nps),
           })) as Response[];
           
           importResponses(parsedData);
           toast({
             title: "Import Successful",
             description: `Imported ${parsedData.length} records.`,
           });
        } else {
           toast({
             variant: "destructive",
             title: "Import Failed",
             description: "CSV format does not match expected schema.",
           });
        }
      },
      error: (error) => {
        toast({
          variant: "destructive",
          title: "Import Error",
          description: error.message,
        });
      }
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getSentimentColor = (sentiment: string) => {
    switch(sentiment) {
      case 'Positive': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'Neutral': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
      case 'Negative': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold">Data Management</h2>
          <p className="text-muted-foreground">View, export, and import your survey data.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
          <Button variant="outline" onClick={handleImportClick} className="gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={handleExport} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Responses</CardTitle>
            <CardDescription>A list of all collected feedback entries.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={clearResponses} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4 mr-2" /> Clear All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead className="text-center">NPS</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead className="max-w-[300px]">Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileSpreadsheet className="w-8 h-8 mb-2 opacity-20" />
                        No data available. Import a CSV or add a response.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  responses.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-xs text-muted-foreground">{row.date}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.feature}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={
                          row.nps >= 9 ? "border-emerald-500 text-emerald-600 bg-emerald-50" :
                          row.nps <= 6 ? "border-rose-500 text-rose-600 bg-rose-50" :
                          "border-amber-500 text-amber-600 bg-amber-50"
                        }>
                          {row.nps}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(row.sentiment)}`}>
                          {row.sentiment}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground" title={row.feedback}>
                        {row.feedback}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
