import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error(error, info); }
  render() {
    return this.state.hasError
      ? <p role="alert" style={{ padding: 24 }}>Bir şeyler ters gitti. Lütfen sayfayı yenileyin.</p>
      : this.props.children;
  }
}