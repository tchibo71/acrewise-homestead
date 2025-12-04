import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductionChart({ productions, livestock }) {
  const [selectedAnimal, setSelectedAnimal] = useState("all");
  const [timeRange, setTimeRange] = useState(30);
  const [displayUnit, setDisplayUnit] = useState("lbs");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeRange);

  const filteredProductions = productions.filter(p => {
    const prodDate = new Date(p.production_date);
    const dateMatch = prodDate >= cutoffDate;
    const animalMatch = selectedAnimal === "all" || p.livestock_id === selectedAnimal;
    return dateMatch && animalMatch;
  });

  // Group by date and sum
  const dataByDate = {};
  filteredProductions.forEach(prod => {
    const date = prod.production_date;
    if (!dataByDate[date]) {
      dataByDate[date] = {
        date,
        milk_lbs: 0,
        milk_gallons: 0,
        butterfat: [],
        protein: []
      };
    }
    dataByDate[date].milk_lbs += prod.milk_weight_lbs || 0;
    dataByDate[date].milk_gallons += prod.milk_weight_gallons || 0;
    if (prod.butterfat_percentage) dataByDate[date].butterfat.push(prod.butterfat_percentage);
    if (prod.protein_percentage) dataByDate[date].protein.push(prod.protein_percentage);
  });

  const chartData = Object.values(dataByDate)
    .map(d => ({
      date: format(new Date(d.date), 'MMM d'),
      milk: parseFloat((displayUnit === "lbs" ? d.milk_lbs : d.milk_gallons).toFixed(1)),
      butterfat: d.butterfat.length > 0 
        ? parseFloat((d.butterfat.reduce((a, b) => a + b, 0) / d.butterfat.length).toFixed(2))
        : null,
      protein: d.protein.length > 0
        ? parseFloat((d.protein.reduce((a, b) => a + b, 0) / d.protein.length).toFixed(2))
        : null
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Over Time</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label>Animal</Label>
            <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Animals</SelectItem>
                {livestock.map(animal => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.name_or_tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Time Range</Label>
            <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Display Unit</Label>
            <Select value={displayUnit} onValueChange={setDisplayUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                <SelectItem value="gallons">Gallons</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="milk" 
              stroke="#3b82f6" 
              name={`Milk (${displayUnit})`}
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="butterfat" 
              stroke="#f59e0b" 
              name="Butterfat %"
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="protein" 
              stroke="#8b5cf6" 
              name="Protein %"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}