import { useEffect } from 'react'

/**
 * Hook to set the page title
 * @param title - The title to set for the page
 * @param suffix - Optional suffix to append (defaults to app name)
 */
export function usePageTitle(title: string, suffix: string = 'Team Sports Manager') {
  useEffect(() => {
    const previousTitle = document.title
    document.title = suffix ? `${title} - ${suffix}` : title
    
    // Cleanup: restore previous title when component unmounts
    return () => {
      document.title = previousTitle
    }
  }, [title, suffix])
}