import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Briefcase, Smartphone } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-sky-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-sky-500 rounded-lg mb-4">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Blue Clean</h1>
            <p className="text-gray-600 mt-2">Cleaning Service Management</p>
          </div>

          {/* Login Options */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Choose your role</span>
              </div>
            </div>

            {/* Admin Login */}
            <div className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 transition">
              <div className="flex items-center mb-3">
                <Briefcase className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="font-semibold text-gray-900">Admin Dashboard</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Manage orders, schedules, and financial reports
              </p>
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Login as Admin
              </Button>
            </div>

            {/* Cleaner Login */}
            <div className="border-2 border-sky-200 rounded-lg p-6 hover:border-sky-400 transition">
              <div className="flex items-center mb-3">
                <Smartphone className="w-5 h-5 text-sky-600 mr-2" />
                <h2 className="font-semibold text-gray-900">Cleaner App</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                View your orders and complete tasks on mobile
              </p>
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white"
              >
                Login as Cleaner
              </Button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-8">
            Both roles use the same login. Your role is assigned by the admin.
          </p>
        </div>
      </div>
    </div>
  );
}
