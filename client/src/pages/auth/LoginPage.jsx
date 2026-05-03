import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import BrandMark from "../../components/BrandMark";
import { useAuth } from "../../context/AuthContext";

const loginDemoUser = {
  email: "user@crosspay.com",
  password: "User@123",
};

const loginDemoAdmin = {
  email: "admin@crosspay.com",
  password: "Admin@123",
};

const features = [
  "Smart routing compares instant, smart, and best-rate corridors automatically.",
  "Transparent quotes show fees, exchange rate, timing, and routing path up front.",
  "Credit scoring and loan access are built directly into the payment journey.",
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const routeAfterLogin = (user) =>
    user?.role?.toUpperCase() === "ADMIN" ? "/admin" : "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setSubmitting(true);
      const res = await login(form);
      navigate(routeAfterLogin(res.user));
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (credentials) => {
    setError("");
    setSubmitting(true);

    try {
      const res = await login(credentials);
      navigate(routeAfterLogin(res.user));
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
      <section className="hero-card flex min-h-[36rem] flex-col justify-between p-7 sm:p-9">
        <div className="space-y-10">
          <p className="flex items-center gap-3 text-sm font-extrabold">
            <span className="h-3 w-3 rounded-full bg-white" />
            Smart remittance workspace
          </p>
          <BrandMark size="lg" className="bg-white/10 shadow-none" />
          <div>
            <h1 className="text-5xl font-extrabold text-white">CrossPay</h1>
            <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-white/80">
              Send money globally, smartly. Monitor wallet balances, compare transfer routes,
              and unlock credit-backed products in one place.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {features.map((feature) => (
            <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-5" key={feature}>
              <p className="text-sm font-bold leading-6 text-white">{feature}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[34rem] flex-col justify-center py-4">
        <div className="text-center">
          <BrandMark className="mx-auto" size="lg" />
          <h2 className="mt-6 text-5xl font-extrabold text-ink">CrossPay</h2>
          <p className="mt-3 text-lg font-medium text-slate-500">Send money globally, smartly</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button className="primary-button" type="button">
            Login
          </button>
          <Link className="secondary-button" to="/register">
            Sign Up
          </Link>
        </div>

        <div className="mt-5 rounded-full bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
          <span className="mr-3 inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          Backend ready for demo access
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block text-sm font-bold text-slate-700">
            Email
            <input
              className="input-field mt-2"
              placeholder="you@example.com"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Password
            <input
              className="input-field mt-2"
              placeholder="Enter your password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>

          {error ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          <button className="primary-button w-full" disabled={submitting} type="submit">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="demo-credential-card" onClick={() => handleDemo(loginDemoUser)} type="button">
            <span className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">
              Demo User
            </span>
            <span className="mt-3 block text-lg font-extrabold text-ink">user@crosspay.com</span>
            <span className="mt-2 block text-sm font-semibold text-slate-500">Password: User@123</span>
          </button>

          <button className="demo-credential-card" onClick={() => handleDemo(loginDemoAdmin)} type="button">
            <span className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">
              Demo Admin
            </span>
            <span className="mt-3 block text-lg font-extrabold text-ink">admin@crosspay.com</span>
            <span className="mt-2 block text-sm font-semibold text-slate-500">Password: Admin@123</span>
          </button>
        </div>

        <p className="mt-7 text-center text-sm font-semibold text-slate-500">
          Don&apos;t have an account?{" "}
          <Link className="font-extrabold text-brand" to="/register">
            Sign up
          </Link>
        </p>
      </section>
    </div>
  );
};

export default LoginPage;
