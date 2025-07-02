export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pt-10">
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      <div className=" flex items-center justify-center relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {children}
        </div>
      </div>
    </div>
  )
} 