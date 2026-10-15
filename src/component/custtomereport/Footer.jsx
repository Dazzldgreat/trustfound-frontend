const Footer = () => {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 py-16 px-6 lg:px-20">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <h2 className="text-accent dark:text-white text-xl font-bold tracking-tight">
              LostFound
            </h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Professional inventory management and item recovery software for
            high-traffic organizations.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="font-bold mb-4 text-accent dark:text-white">Product</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li><a className="hover:text-primary transition-colors" href="#">Features</a></li>
            <li><a className="hover:text-primary transition-colors" href="#pricing">Pricing</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Mobile App</a></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-bold mb-4 text-accent dark:text-white">Company</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
            <li><a className="hover:text-primary transition-colors" href="#testimonials">Success Stories</a></li>
            <li><a className="hover:text-primary transition-colors" href="#contact">Contact</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-bold mb-4 text-accent dark:text-white">Legal</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-t border-gray-100 dark:border-gray-800 pt-8">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
          © 2024 LostFound Technology Inc.
        </p>

        <div className="flex gap-4">
          <a className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary transition-colors" href="#">
            <span className="material-symbols-outlined text-lg">public</span>
          </a>
          <a className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary transition-colors" href="#">
            <span className="material-symbols-outlined text-lg">group</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
