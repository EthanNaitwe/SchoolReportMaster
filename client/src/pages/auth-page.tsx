import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertUser } from "@shared/types";
import { z } from "zod";
import { GraduationCap, FileText, Upload, BarChart3 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (user) {
    return null; // Will redirect via useEffect
  }

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 lg:mb-8">
            <div className="flex items-center justify-center mb-4">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2" />
              <h1 className="text-xl sm:text-2xl font-bold">Tamayuz Report System</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Sign in to manage student reports and academic data
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList> */}
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the system
                  </CardDescription>
                </CardHeader>
                <form onSubmit={loginForm.handleSubmit(onLogin)}>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm">Username</Label>
                      <Input
                        id="username"
                        {...loginForm.register("username")}
                        placeholder="Enter your username"
                        className="h-10 sm:h-11"
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        {...loginForm.register("password")}
                        placeholder="Enter your password"
                        className="h-10 sm:h-11"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-10 sm:h-11"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>
                    Register for access to the Tamayuz Report System
                  </CardDescription>
                </CardHeader>
                <form onSubmit={registerForm.handleSubmit(onRegister)}>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm">First Name</Label>
                        <Input
                          id="firstName"
                          {...registerForm.register("firstName")}
                          placeholder="First name"
                          className="h-10 sm:h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                        <Input
                          id="lastName"
                          {...registerForm.register("lastName")}
                          placeholder="Last name"
                          className="h-10 sm:h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-username" className="text-sm">Username</Label>
                      <Input
                        id="reg-username"
                        {...registerForm.register("username")}
                        placeholder="Choose a username"
                        className="h-10 sm:h-11"
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...registerForm.register("email")}
                        placeholder="Enter your email"
                        className="h-10 sm:h-11"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-sm">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        {...registerForm.register("password")}
                        placeholder="Create a password"
                        className="h-10 sm:h-11"
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...registerForm.register("confirmPassword")}
                        placeholder="Confirm your password"
                        className="h-10 sm:h-11"
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-10 sm:h-11"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create account"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex flex-1 bg-muted/30 items-center justify-center p-6 lg:p-8">
        <div className="max-w-md text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6">Streamline Academic Management</h2>
          <p className="text-sm lg:text-base text-muted-foreground mb-6 lg:mb-8">
            Upload student data, validate records, and generate professional report cards 
            with our comprehensive academic management system.
          </p>
          
          <div className="grid grid-cols-2 gap-3 lg:gap-4 text-xs lg:text-sm">
            <div className="flex flex-col items-center p-3 lg:p-4 bg-background rounded-lg">
              <Upload className="h-6 w-6 lg:h-8 lg:w-8 text-primary mb-2" />
              <span className="font-medium">Easy Upload</span>
              <span className="text-muted-foreground">Excel file processing</span>
            </div>
            <div className="flex flex-col items-center p-3 lg:p-4 bg-background rounded-lg">
              <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-primary mb-2" />
              <span className="font-medium">Data Validation</span>
              <span className="text-muted-foreground">Automatic verification</span>
            </div>
            <div className="flex flex-col items-center p-3 lg:p-4 bg-background rounded-lg">
              <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-primary mb-2" />
              <span className="font-medium">Analytics</span>
              <span className="text-muted-foreground">Performance insights</span>
            </div>
            <div className="flex flex-col items-center p-3 lg:p-4 bg-background rounded-lg">
              <GraduationCap className="h-6 w-6 lg:h-8 lg:w-8 text-primary mb-2" />
              <span className="font-medium">PDF Reports</span>
              <span className="text-muted-foreground">Professional output</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile bottom section with key features */}
      <div className="lg:hidden bg-muted/30 p-4 sm:p-6">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-bold mb-3">Academic Management Features</h2>
          <div className="flex justify-center space-x-6">
            <div className="flex flex-col items-center">
              <Upload className="h-5 w-5 text-primary mb-1" />
              <span className="text-xs font-medium">Upload</span>
            </div>
            <div className="flex flex-col items-center">
              <FileText className="h-5 w-5 text-primary mb-1" />
              <span className="text-xs font-medium">Validate</span>
            </div>
            <div className="flex flex-col items-center">
              <BarChart3 className="h-5 w-5 text-primary mb-1" />
              <span className="text-xs font-medium">Analytics</span>
            </div>
            <div className="flex flex-col items-center">
              <GraduationCap className="h-5 w-5 text-primary mb-1" />
              <span className="text-xs font-medium">Reports</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}