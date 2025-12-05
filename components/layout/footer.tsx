import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Bio Sculpture</h3>
            <p className="text-gray-600">
              Premium nail products and treatments for professionals and
              enthusiasts.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-600 hover:text-black">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-black">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-black">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <p className="text-gray-600">Email: info@biosculpture.com</p>
            <p className="text-gray-600">Phone: (555) 123-4567</p>
            <div className="flex flex-wrap items-center gap-1 mt-4">
              <Image
                src="/maestro-61c41725.svg"
                alt="Maestro"
                width={40}
                height={25}
                className="h-[18px] w-auto"
              />
              <Image
                src="/paypal-a7c68b85.svg"
                alt="PayPal"
                width={40}
                height={25}
                className="h-[18px] w-auto"
              />
              <Image
                src="/master-54b5a7ce.svg"
                alt="Mastercard"
                width={40}
                height={25}
                className="h-[18px] w-auto"
              />
              <Image
                src="/visa-65d650f7.svg"
                alt="Visa"
                width={40}
                height={25}
                className="h-[18px] w-auto"
              />
              <Image
                src="/google_pay-34c30515 (1).svg"
                alt="Google Pay"
                width={40}
                height={25}
                className="h-[18px] w-auto"
              />
              <Image
                src="/apple_pay-1721ebad (1).svg"
                alt="Apple Pay"
                width={40}
                height={25}
                className="h-[18px] w-auto"
              />
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Bio Sculpture. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

