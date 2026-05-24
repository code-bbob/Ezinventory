"use client"

import { TrendingUp, Calendar } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  ResponsiveContainer,
  Line,
  LineChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import useAxios from "@/utils/useAxios";
import { useEffect, useState } from "react";

const barChartConfig = {
  Sales: {
    label: "Value:",
    color: "rgba(139, 92, 246, 0.7)"
  }
};

const lineChartConfig = {
  count: {
    label: "Sales Count",
    color: "#3b82f6",
  },
};

export default function ChartsDashboard() {
  const api = useAxios();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [barData, setBarData] = useState({});
  const [barChartData, setBarChartData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bar chart data
        const barResponse = await api.get("/transaction/barchart/");
        setBarData(barResponse.data);
        setBarChartData(barResponse.data.count);

        // Fetch line chart data
        const lineResponse = await api.get("transaction/linegraph/");
        setLineChartData(lineResponse.data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();
  }, []);

  // Handle date search to filter bar chart data
  const handleDateSearch = async (e) => {
    e.preventDefault();

    try {
      const response = await api.get(
        `/transaction/barchart/?start_date=${startDate}&end_date=${endDate}`
      );
      setBarData(response.data);
      setBarChartData(response.data.profit);
      setIsFiltered(true);
    } catch (err) {
      console.error("Failed to filter transactions by date:", err);
    }
  };

  const brandsSold = (chartData) => {
    let count = 0;
    chartData?.forEach((brand) => {
      if (brand.Sales > 0) {
        count++;
      }
    });
    return count;
  };

  const highestSold = (chartData) => {
    if (!chartData || chartData.length === 0) return "N/A";
    const sortedData = [...chartData].sort((a, b) => b.Sales - a.Sales);
    return sortedData[0].Brand;
  };

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Date Filter */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Chart Filters</CardTitle>
          <CardDescription className="text-slate-300">
            Filter charts by date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleDateSearch}
            className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4"
          >
            <div className="flex items-center space-x-2">
              <Label htmlFor="startDate" className="text-white whitespace-nowrap">
                Start:
              </Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="endDate" className="text-white whitespace-nowrap">
                End:
              </Label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full lg:w-auto bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Filter by Date
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Bar Chart */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">
              {!isFiltered ? "Sales Overview - Past Month" : "Filtered Sales Data"}
            </CardTitle>
            <CardDescription className="text-slate-300">
              Brand performance by sales count
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            <ChartContainer className="w-full h-80 min-w-0" config={barChartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20
                  }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="Brand"
                    className="text-white"
                    tick={{ fill: 'white', fontSize: 12 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="Sales" fill="rgba(139, 92, 246, 0.7)" radius={8}>
                    <LabelList position="top" offset={12} fontSize={12} fill="white" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0 gap-4 text-sm">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2 font-medium leading-none text-white">
                {brandsSold(barChartData)} Brands sold {!isFiltered && <span>this month</span>}
              </div>
              <div className="leading-none flex items-center text-slate-300">
                <span className="font-bold mr-1 text-green-400">
                  {highestSold(barChartData)}
                </span>
                was the top seller
                <TrendingUp className="h-4 ml-2 w-4" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-slate-700 text-white hover:bg-purple-600 border-slate-600" 
                onClick={() => setBarChartData(barData.count)}
              >
                Count
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-slate-700 text-white hover:bg-purple-600 border-slate-600" 
                onClick={() => setBarChartData(barData.amount)}
              >
                Amount
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-slate-700 text-white hover:bg-purple-600 border-slate-600" 
                onClick={() => setBarChartData(barData.profit)}
              >
                Profit
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Line Chart */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">Sales Trend</CardTitle>
            <CardDescription className="text-slate-300">
              Daily sales performance overview
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            <ChartContainer className="h-80 min-w-0" config={lineChartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  accessibilityLayer
                  data={lineChartData}
                  margin={{
                    left: 48,
                    right: 12,
                    top: 20,
                    bottom: 20
                  }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: 'white', fontSize: 12 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Line
                    dataKey="count"
                    type="linear"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none text-white">
              Weekly performance tracking
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <div className="leading-none text-slate-300">
              Showing daily sales trends for better insights
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
