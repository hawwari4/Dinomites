import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error', error, info)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
          <div className="max-w-sm text-center bg-white border border-slate-100 rounded-2xl shadow-soft p-8">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 grid place-items-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              This screen hit an unexpected error. Reloading usually fixes it.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-qstp-500 hover:bg-qstp-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
