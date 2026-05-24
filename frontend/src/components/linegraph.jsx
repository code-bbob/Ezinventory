"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import useAxios from "@/utils/useAxios"
import { useEffect, useState } from "react"

export const description = "A linear line chart"

// const chartData = [
//     {
//         "day": "Wednesday",
//         "count": 0
//     },
//     {
//         "day": "Thursday",
//         "count": 953500.0
//     },
//     {
//         "day": "Friday",
//         "count": 158500.0
//     },
//     {
//         "day": "Saturday",
//         "count": 13000.0
//     },
//     {
//         "day": "Sunday",
//         "count": 0
//     },
//     {
//         "day": "Monday",
//         "count": 0
//     },
//     {
//         "day": "Tuesday",
//         "count": 0
//     }
// ]

const chartConfig = {
  desktop: {
    label: "count",
    color: "blue",
  },
} 

export default function LineGraph() {

    const [chartData,setChartData] = useState([])
    const api = useAxios()
    useEffect(() => {
        const fetchData = async () => {
        try {
          const response = await api.get("transaction/linegraph/")
          setChartData(response.data)
        } catch (err) {
            console.log("Failed to fetch line graph data",err)
            }
        }
        fetchData();
        
    }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Linear</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-96" config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 48,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            //   tickFormatter={(value) => value.slice(0,)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="count"
              type="linear"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
