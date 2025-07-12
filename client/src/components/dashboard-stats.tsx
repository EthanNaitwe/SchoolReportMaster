import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileUp, Clock, FileText, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Total Uploads",
      value: stats?.totalUploads || 0,
      icon: FileUp,
      bgColor: "bg-academic-blue bg-opacity-10",
      textColor: "text-academic-blue",
      valueColor: "text-academic-text"
    },
    {
      title: "Pending Approval",
      value: stats?.pendingApproval || 0,
      icon: Clock,
      bgColor: "bg-academic-warning bg-opacity-10",
      textColor: "text-academic-warning",
      valueColor: "text-academic-warning"
    },
    {
      title: "Reports Generated",
      value: stats?.reportsGenerated || 0,
      icon: FileText,
      bgColor: "bg-approval-green bg-opacity-10",
      textColor: "text-approval-green",
      valueColor: "text-approval-green"
    },
    {
      title: "Success Rate",
      value: `${stats?.successRate || 0}%`,
      icon: CheckCircle,
      bgColor: "bg-approval-green bg-opacity-10",
      textColor: "text-approval-green",
      valueColor: "text-academic-text"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-medium ${stat.valueColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
