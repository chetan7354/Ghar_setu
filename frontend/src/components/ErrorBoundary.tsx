import { Component, type ReactNode } from 'react'

const KEY = 'gs_crash_reload'

// Browser translators and some extensions rewrite text nodes React owns, which can crash a page change.
// Make React's DOM removals/insertions tolerate nodes that were moved by someone else.
export function guardForeignDomChanges() {
  const remove = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child
    return remove.call(this, child) as T
  }
  const insert = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return insert.call(this, node, null) as T
    return insert.call(this, node, ref) as T
  }
}

// Instead of a blank white screen: reload once (a fresh load fixes most one-off crashes), then show the error.
export class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) {
    console.error(error)
    let tried = false
    try { tried = sessionStorage.getItem(KEY) === location.href; sessionStorage.setItem(KEY, location.href) } catch { /* storage blocked */ }
    if (!tried) location.reload()
  }
  componentDidMount() {
    setTimeout(() => { try { sessionStorage.removeItem(KEY) } catch { /* storage blocked */ } }, 5000)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <p className="text-lg font-semibold text-slate-800">This page could not be shown.</p>
        <p className="mt-2 break-words text-sm text-slate-500">{this.state.error.message}</p>
        <button className="btn-primary mt-5" onClick={() => location.reload()}>Reload page</button>
      </div>
    )
  }
}
