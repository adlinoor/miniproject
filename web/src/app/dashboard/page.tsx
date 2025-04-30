"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/api";
import { useDispatch, useSelector } from "@/lib/redux/hooks";
import { selectUser } from "@/lib/redux/features/userSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FiCalendar, FiDollarSign, FiUsers } from "react-icons/fi";

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  upcomingEvents: number;
  monthlySales: Array<{ month: string; sales: number }>;
  eventPopularity: Array<{ name: string; ticketsSold: number }>;
}

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "organizer") {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/users/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "organizer") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold">
          Organizer dashboard access only
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Organizer Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-lg h-32 animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Events</p>
                    <h3 className="text-2xl font-bold">{stats.totalEvents}</h3>
                  </div>
                  <FiCalendar className="text-indigo-600 text-2xl" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Active Events</p>
                    <h3 className="text-2xl font-bold">{stats.activeEvents}</h3>
                  </div>
                  <FiCalendar className="text-green-600 text-2xl" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Revenue</p>
                    <h3 className="text-2xl font-bold">
                      IDR {stats.totalRevenue.toLocaleString()}
                    </h3>
                  </div>
                  <FiDollarSign className="text-yellow-600 text-2xl" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Upcoming Events</p>
                    <h3 className="text-2xl font-bold">
                      {stats.upcomingEvents}
                    </h3>
                  </div>
                  <FiUsers className="text-blue-600 text-2xl" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Monthly Sales</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `IDR ${value.toLocaleString()}`,
                          "Sales",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Event Popularity</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.eventPopularity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="ticketsSold"
                        fill="#82ca9d"
                        name="Tickets Sold"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
