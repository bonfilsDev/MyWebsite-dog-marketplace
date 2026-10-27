import { useEffect } from 'react'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | PawMarket` : 'PawMarket | Find your next best friend'
  }, [title])
}
