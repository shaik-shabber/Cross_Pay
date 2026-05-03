import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      message: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected frontend error",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CrossPay frontend crashed:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-6">
        <div className="surface-card max-w-2xl space-y-5 p-8 text-center">
          <p className="text-sm font-semibold text-slate-500">Frontend Recovery</p>
          <h1 className="text-4xl font-extrabold text-ink">Something broke in the UI</h1>
          <p className="text-sm font-medium text-slate-500">
            The app hit a browser-side error. Reload the page to recover and try the action again.
          </p>
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-left text-sm text-red-700">
            {this.state.message}
          </div>
          <div className="flex justify-center gap-3">
            <button className="primary-button" onClick={this.handleReload} type="button">
              Reload App
            </button>
            <a className="secondary-button" href="/">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }
}
