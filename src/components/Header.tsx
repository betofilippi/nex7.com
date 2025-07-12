import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full p-6 border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">NEX7</h1>
        <div className="flex gap-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-blue-600 transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">
            Contact
          </Link>
        </div>
      </nav>
    </header>
  )
}