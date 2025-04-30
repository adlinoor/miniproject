"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "@/lib/redux/hooks";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/lib/redux/features/authSlice";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "@/lib/api";
import Swal from "sweetalert2";
import AuthForm from "@/components/auth/AuthForm";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().required("Required"),
});

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      dispatch(loginStart());

      const response = await axios.post("/api/auth/login", values);
      const { user, token } = response.data;

      // Set cookie (using next-cookies or similar)
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;

      dispatch(loginSuccess({ user, token }));
      router.push("/dashboard");

      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: `Welcome back, ${user.first_name}!`,
      });
    } catch (error: any) {
      dispatch(loginFailure(error.response?.data?.message || "Login failed"));
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm type="login">
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <Field
                type="email"
                name="email"
                id="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Field
                type="password"
                name="password"
                id="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
              <ErrorMessage
                name="password"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting || loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </AuthForm>
  );
}
