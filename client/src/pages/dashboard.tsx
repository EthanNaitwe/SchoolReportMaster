import { Upload, FileText, TrendingUp, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardStats from "@/components/dashboard-stats";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-academic-text">Welcome to Academic Report System</h1>
          <p className="text-gray-600 mt-2">Manage student grades and generate report cards efficiently</p>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-academic-text mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Upload Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/uploads">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Upload Files</CardTitle>
                      <CardDescription>Upload Excel files with student grades</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload and validate student grade data from Excel spreadsheets
                  </p>
                  <Button className="w-full bg-academic-blue hover:bg-blue-700">
                    Go to Uploads
                  </Button>
                </CardContent>
              </Link>
            </Card>

            {/* Reports Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/reports">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Manage Reports</CardTitle>
                      <CardDescription>Generate and download report cards</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate PDF report cards and manage existing reports
                  </p>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Go to Reports
                  </Button>
                </CardContent>
              </Link>
            </Card>

            {/* Analytics Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Analytics</CardTitle>
                    <CardDescription>View system performance and stats</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Track upload success rates and system usage metrics
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-academic-text mb-4">System Status</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium text-academic-text">System Online</p>
                  <p className="text-sm text-gray-600">All services are running normally</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
