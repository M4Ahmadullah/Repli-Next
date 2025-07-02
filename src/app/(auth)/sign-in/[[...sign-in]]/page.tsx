import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className='mt-20'>
      <SignIn 
        routing="path"
        path="/sign-in"
        redirectUrl="/dashboard"
        appearance={{
          elements: {
            card: 'shadow-2xl border border-green-200 dark:border-green-700',
            headerTitle: 'text-green-800 dark:text-green-100',
            headerSubtitle: 'text-green-600 dark:text-green-300',
            socialButtonsBlockButton: 'border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
            socialButtonsBlockButtonText: 'text-green-800 dark:text-green-100',
            formButtonPrimary: 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white',
            footerActionLink: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300',
          }
        }}
      />
    </div>
  )
} 