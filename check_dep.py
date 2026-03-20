#!/usr/bin/env python3
"""
NeuralVision AI - Enterprise Dependency Checker
Version: 2.0.0
"""

import sys
import subprocess
import importlib
import platform
import os
import time
from datetime import datetime

# ANSI Colors for beautiful output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    
    @staticmethod
    def supports_color():
        """Check if terminal supports color"""
        plat = sys.platform
        supported_platform = plat != 'win32' or 'ANSICON' in os.environ
        is_a_tty = hasattr(sys.stdout, 'isatty') and sys.stdout.isatty()
        return supported_platform and is_a_tty

# Disable colors if not supported
if not Colors.supports_color():
    for attr in dir(Colors):
        if not attr.startswith('_') and isinstance(getattr(Colors, attr), str):
            setattr(Colors, attr, '')

class NeuralVisionDependencyChecker:
    def __init__(self):
        self.start_time = time.time()
        
        # Core dependencies
        self.core_packages = {
            'flask': '2.3.3',
            'flask_cors': '4.0.0',
            'flask_socketio': '5.3.4',
            'python_dotenv': '1.0.0',
            'PIL': '10.0.0',  # Pillow
            'cv2': '4.8.0',    # opencv-python
            'numpy': '1.24.3',
        }
        
        # AI/ML dependencies
        self.ai_packages = {
            'torch': '2.0.1',
            'torchvision': '0.15.2',
            'transformers': '4.31.0',
            'ultralytics': '8.0.196',
        }
        
        # Additional dependencies
        self.extra_packages = {
            'werkzeug': '2.3.7',
            'gunicorn': '21.2.0',
            'packaging': '23.1',
            'redis': '4.6.0',
            'celery': '5.3.1',
            'eventlet': '0.33.3',
            'python_socketio': '5.9.0',
        }
        
        # All packages combined
        self.all_packages = {**self.core_packages, **self.ai_packages, **self.extra_packages}
        
        # Package name mappings (import name -> pip name)
        self.package_names = {
            'flask': 'Flask',
            'flask_cors': 'Flask-CORS',
            'flask_socketio': 'Flask-SocketIO',
            'python_dotenv': 'python-dotenv',
            'PIL': 'Pillow',
            'cv2': 'opencv-python',
            'torch': 'torch',
            'torchvision': 'torchvision',
            'transformers': 'transformers',
            'ultralytics': 'ultralytics',
            'numpy': 'numpy',
            'werkzeug': 'Werkzeug',
            'gunicorn': 'gunicorn',
            'packaging': 'packaging',
            'redis': 'redis',
            'celery': 'celery',
            'eventlet': 'eventlet',
            'python_socketio': 'python-socketio',
        }
        
        # Results storage
        self.results = {
            'python': {},
            'system': {},
            'core': {'installed': [], 'missing': [], 'wrong_version': []},
            'ai': {'installed': [], 'missing': [], 'wrong_version': []},
            'extra': {'installed': [], 'missing': [], 'wrong_version': []},
            'gpu': {},
            'models': {'available': [], 'unavailable': []},
            'disk': {},
            'network': {}
        }

    def print_header(self, text):
        """Print formatted header"""
        print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
        print(f"{Colors.CYAN}{Colors.BOLD}{text:^70}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")

    def print_section(self, text):
        """Print section header"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}▶ {text}{Colors.ENDC}")
        print(f"{Colors.BLUE}{'-'*50}{Colors.ENDC}")

    def print_status(self, status, message, details=None):
        """Print status with appropriate icon and color"""
        icons = {
            'success': '✅',
            'warning': '⚠️ ',
            'error': '❌',
            'info': 'ℹ️ ',
            'pending': '⏳',
            'cpu': '💻',
            'gpu': '🎮',
            'memory': '💾',
            'disk': '📀',
            'network': '🌐',
            'model': '🤖',
            'package': '📦',
        }
        
        colors = {
            'success': Colors.GREEN,
            'warning': Colors.YELLOW,
            'error': Colors.RED,
            'info': Colors.BLUE,
            'pending': Colors.CYAN,
            'cpu': Colors.MAGENTA,
            'gpu': Colors.CYAN,
            'memory': Colors.YELLOW,
            'disk': Colors.BLUE,
            'network': Colors.GREEN,
            'model': Colors.MAGENTA,
            'package': Colors.CYAN,
        }
        
        icon = icons.get(status, '•')
        color = colors.get(status, Colors.ENDC)
        
        print(f"  {color}{icon} {message}{Colors.ENDC}")
        if details:
            print(f"     {Colors.BLUE}→{Colors.ENDC} {details}")

    def check_python_version(self):
        """Check Python version compatibility"""
        self.print_section("Python Environment")
        
        version = sys.version_info
        current = f"{version.major}.{version.minor}.{version.micro}"
        
        self.print_status('info', f"Python Version: {current}", 
                         f"Path: {sys.executable}")
        
        # Check compatibility
        if version.major == 3 and 8 <= version.minor <= 11:
            self.print_status('success', "Python version is compatible", 
                            "Recommended: 3.8-3.11")
            self.results['python']['compatible'] = True
        else:
            self.print_status('warning', "Python version may have compatibility issues", 
                            "Recommended: 3.8-3.11")
            self.results['python']['compatible'] = False
        
        self.results['python']['version'] = current
        self.results['python']['path'] = sys.executable

    def check_system(self):
        """Check system information"""
        self.print_section("System Information")
        
        # OS info
        os_info = f"{platform.system()} {platform.release()}"
        self.print_status('info', f"Operating System: {os_info}")
        self.results['system']['os'] = os_info
        
        # Architecture
        arch = platform.machine()
        self.print_status('info', f"Architecture: {arch}")
        self.results['system']['arch'] = arch
        
        # Processor
        processor = platform.processor() or "Unknown"
        self.print_status('cpu', f"Processor: {processor}")
        self.results['system']['processor'] = processor

    def check_packages(self):
        """Check all required packages"""
        self.print_section("Package Dependencies")
        
        all_installed = []
        all_missing = []
        
        for import_name, required_version in self.all_packages.items():
            package_name = self.package_names.get(import_name, import_name)
            category = self.get_package_category(import_name)
            
            try:
                # Try to import the package
                module = importlib.import_module(import_name)
                
                # Get version
                version = self.get_package_version(module, import_name)
                
                # Check version compatibility
                if version and self.compare_versions(version, required_version):
                    status = 'success'
                    message = f"{package_name} {version}"
                    details = f"✓ Compatible with required {required_version}"
                    self.results[category]['installed'].append({
                        'name': package_name,
                        'version': version,
                        'required': required_version
                    })
                else:
                    status = 'warning'
                    message = f"{package_name} {version or 'unknown'}"
                    details = f"⚠ Version mismatch (required: {required_version})"
                    self.results[category]['wrong_version'].append({
                        'name': package_name,
                        'version': version,
                        'required': required_version
                    })
                
                self.print_status(status, message, details)
                all_installed.append(package_name)
                
            except ImportError as e:
                status = 'error'
                message = f"{package_name}"
                details = f"❌ NOT INSTALLED - Required: {required_version}"
                self.print_status(status, message, details)
                
                self.results[category]['missing'].append({
                    'name': package_name,
                    'required': required_version
                })
                all_missing.append(package_name)
        
        return all_installed, all_missing

    def get_package_category(self, import_name):
        """Determine package category"""
        if import_name in self.core_packages:
            return 'core'
        elif import_name in self.ai_packages:
            return 'ai'
        else:
            return 'extra'

    def get_package_version(self, module, import_name):
        """Safely get package version"""
        try:
            if hasattr(module, '__version__'):
                return module.__version__
            elif hasattr(module, 'version'):
                return module.version
            elif import_name == 'cv2':
                return module.__version__
            else:
                return None
        except:
            return None

    def compare_versions(self, current, required):
        """Simple version comparison"""
        if not current:
            return False
        
        # Extract major.minor.patch
        def normalize(v):
            v = v.split('.')
            while len(v) < 3:
                v.append('0')
            return tuple(int(x.split('-')[0]) for x in v[:3])
        
        try:
            curr = normalize(current)
            req = normalize(required)
            return curr >= req
        except:
            return True  # If can't compare, assume it's fine

    def check_gpu(self):
        """Check GPU availability"""
        self.print_section("GPU Acceleration")
        
        try:
            import torch
            
            if torch.cuda.is_available():
                gpu_count = torch.cuda.device_count()
                gpu_name = torch.cuda.get_device_name(0)
                cuda_version = torch.version.cuda
                
                self.print_status('gpu', f"GPU Available: Yes", 
                                f"Device: {gpu_name}")
                self.print_status('info', f"GPU Count: {gpu_count}")
                self.print_status('info', f"CUDA Version: {cuda_version}")
                
                # Check GPU memory
                if gpu_count > 0:
                    for i in range(min(gpu_count, 2)):  # Show first 2 GPUs
                        props = torch.cuda.get_device_properties(i)
                        memory = props.total_memory / (1024**3)
                        self.print_status('info', f"GPU {i} Memory: {memory:.1f} GB")
                
                self.results['gpu']['available'] = True
                self.results['gpu']['name'] = gpu_name
                self.results['gpu']['count'] = gpu_count
                self.results['gpu']['cuda'] = cuda_version
                
            else:
                self.print_status('cpu', f"GPU Available: No", 
                                "Using CPU (slower performance)")
                self.results['gpu']['available'] = False
                
        except ImportError:
            self.print_status('error', "PyTorch not installed - cannot check GPU")
            self.results['gpu']['available'] = False
        except Exception as e:
            self.print_status('warning', f"GPU check failed: {str(e)}")
            self.results['gpu']['available'] = False

    def check_disk_space(self):
        """Check available disk space"""
        self.print_section("Disk Space")
        
        try:
            import shutil
            
            # Get disk usage for current directory
            usage = shutil.disk_usage(os.getcwd())
            
            free_gb = usage.free / (1024**3)
            total_gb = usage.total / (1024**3)
            
            self.print_status('disk', f"Free Space: {free_gb:.2f} GB", 
                            f"Total: {total_gb:.2f} GB")
            
            if free_gb < 10:
                self.print_status('warning', "Low disk space", 
                                "Models require ~10GB free space")
                self.results['disk']['sufficient'] = False
            else:
                self.print_status('success', "Sufficient disk space available")
                self.results['disk']['sufficient'] = True
            
            self.results['disk']['free_gb'] = free_gb
            self.results['disk']['total_gb'] = total_gb
            
        except Exception as e:
            self.print_status('warning', f"Could not check disk space: {str(e)}")

    def check_memory(self):
        """Check available RAM"""
        self.print_section("Memory")
        
        try:
            import psutil
            
            memory = psutil.virtual_memory()
            available_gb = memory.available / (1024**3)
            total_gb = memory.total / (1024**3)
            
            self.print_status('memory', f"Available RAM: {available_gb:.2f} GB", 
                            f"Total: {total_gb:.2f} GB")
            
            if available_gb < 4:
                self.print_status('warning', "Low memory available", 
                                "4GB+ recommended for AI models")
                self.results['memory']['sufficient'] = False
            else:
                self.print_status('success', "Sufficient memory available")
                self.results['memory']['sufficient'] = True
            
            self.results['memory']['available_gb'] = available_gb
            self.results['memory']['total_gb'] = total_gb
            
        except ImportError:
            self.print_status('warning', "psutil not installed - cannot check memory")
            self.results['memory']['sufficient'] = None
        except Exception as e:
            self.print_status('warning', f"Could not check memory: {str(e)}")

    def check_internet(self):
        """Check internet connectivity"""
        self.print_section("Internet Connectivity")
        
        import socket
        
        hosts = [
            ('Hugging Face', 'huggingface.co', 443),
            ('GitHub', 'github.com', 443),
            ('PyPI', 'pypi.org', 443),
            ('Google', 'google.com', 443)
        ]
        
        connected = False
        
        for name, host, port in hosts:
            try:
                socket.create_connection((host, port), timeout=3)
                self.print_status('network', f"✓ {name} reachable")
                connected = True
            except:
                self.print_status('warning', f"⚠ {name} unreachable")
        
        self.results['network']['connected'] = connected

    def check_model_files(self):
        """Check if model files exist or can be downloaded"""
        self.print_section("AI Models")
        
        models = [
            ('YOLOv8', 'yolov8n.pt', 'ultralytics'),
            ('BLIP', 'Salesforce/blip-image-captioning-base', 'transformers'),
            ('ViLT', 'dandelin/vilt-b32-finetuned-vqa', 'transformers'),
            ('DETR', 'facebook/detr-resnet-50', 'transformers'),
        ]
        
        for name, model_id, library in models:
            if library == 'ultralytics':
                # Check YOLO model
                try:
                    from ultralytics import YOLO
                    model = YOLO('yolov8n.pt')
                    self.print_status('model', f"✓ {name} available")
                    self.results['models']['available'].append(name)
                except:
                    self.print_status('warning', f"⚠ {name} not downloaded", 
                                    "Will download on first use")
                    self.results['models']['unavailable'].append(name)
            else:
                # Check HuggingFace models
                try:
                    from transformers import AutoConfig
                    config = AutoConfig.from_pretrained(model_id, trust_remote_code=True)
                    self.print_status('model', f"✓ {name} available")
                    self.results['models']['available'].append(name)
                except:
                    self.print_status('warning', f"⚠ {name} not downloaded", 
                                    "Will download on first use")
                    self.results['models']['unavailable'].append(name)

    def check_port(self, port=5000):
        """Check if the default port is available"""
        self.print_section("Port Availability")
        
        import socket
        
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        
        if result != 0:
            self.print_status('success', f"Port {port} is available")
            self.results['port']['available'] = True
        else:
            self.print_status('warning', f"Port {port} is in use", 
                            "Will use alternative port")
            self.results['port']['available'] = False

    def generate_install_commands(self):
        """Generate installation commands for missing packages"""
        self.print_section("Installation Commands")
        
        all_missing = []
        all_wrong_version = []
        
        for category in ['core', 'ai', 'extra']:
            all_missing.extend(self.results[category]['missing'])
            all_wrong_version.extend(self.results[category]['wrong_version'])
        
        if all_missing or all_wrong_version:
            print(f"\n{Colors.YELLOW}Missing or incorrect packages detected:{Colors.ENDC}\n")
            
            # Missing packages
            if all_missing:
                print(f"{Colors.BOLD}Install missing packages:{Colors.ENDC}")
                missing_cmd = "pip install " + " ".join([
                    f"{pkg['name']}>={pkg['required']}" 
                    for pkg in all_missing
                ])
                print(f"  {Colors.CYAN}{missing_cmd}{Colors.ENDC}\n")
            
            # Version mismatches
            if all_wrong_version:
                print(f"{Colors.BOLD}Update packages to correct versions:{Colors.ENDC}")
                for pkg in all_wrong_version:
                    print(f"  {Colors.YELLOW}pip install --upgrade {pkg['name']}>={pkg['required']}{Colors.ENDC}")
            
            # Full requirements install
            print(f"\n{Colors.BOLD}Or install all at once:{Colors.ENDC}")
            print(f"  {Colors.GREEN}pip install -r requirements.txt{Colors.ENDC}")
            
        else:
            self.print_status('success', "All packages are installed correctly")

    def generate_report(self):
        """Generate a comprehensive report"""
        self.print_header("📊 NEURALVISION AI - DEPENDENCY REPORT")
        
        # Summary
        print(f"\n{Colors.BOLD}Summary:{Colors.ENDC}")
        print(f"  • Python: {self.results['python'].get('version', 'Unknown')}")
        print(f"  • GPU: {'✅ Available' if self.results['gpu'].get('available') else '❌ Not available'}")
        
        # Package counts
        core_installed = len(self.results['core']['installed'])
        core_total = len(self.core_packages)
        ai_installed = len(self.results['ai']['installed'])
        ai_total = len(self.ai_packages)
        extra_installed = len(self.results['extra']['installed'])
        extra_total = len(self.extra_packages)
        
        print(f"  • Core Packages: {core_installed}/{core_total}")
        print(f"  • AI Packages: {ai_installed}/{ai_total}")
        print(f"  • Extra Packages: {extra_installed}/{extra_total}")
        
        # Issues
        issues = []
        if not self.results['gpu'].get('available'):
            issues.append("⚠ GPU not available - performance will be slower")
        
        if not self.results['disk'].get('sufficient', True):
            issues.append("⚠ Low disk space - may affect model downloads")
        
        if not self.results['memory'].get('sufficient', True):
            issues.append("⚠ Low memory - may cause performance issues")
        
        missing_count = sum([
            len(self.results['core']['missing']),
            len(self.results['ai']['missing']),
            len(self.results['extra']['missing'])
        ])
        
        if missing_count > 0:
            issues.append(f"❌ {missing_count} package(s) missing")
        
        if issues:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}Issues Found:{Colors.ENDC}")
            for issue in issues:
                print(f"  {issue}")
        else:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✅ No issues found! System is ready.{Colors.ENDC}")
        
        # Recommendations
        print(f"\n{Colors.BOLD}{Colors.BLUE}Recommendations:{Colors.ENDC}")
        print(f"  • Run 'pip install -r requirements.txt' to ensure all packages")
        print(f"  • For GPU support: pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118")
        print(f"  • Start the app with: python app.py")
        print(f"  • Access at: http://localhost:5000")
        
        # Performance
        elapsed = time.time() - self.start_time
        print(f"\n{Colors.BOLD}Check completed in {elapsed:.2f} seconds{Colors.ENDC}")

    def run_all_checks(self):
        """Run all dependency checks"""
        self.print_header("🚀 NEURALVISION AI - ENTERPRISE DEPENDENCY CHECKER")
        print(f"{Colors.BLUE}Version: 2.0.0 | Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.ENDC}")
        
        # Run checks
        self.check_python_version()
        self.check_system()
        self.check_packages()
        self.check_gpu()
        self.check_memory()
        self.check_disk_space()
        self.check_internet()
        self.check_model_files()
        self.check_port()
        
        # Generate report
        self.generate_report()
        self.generate_install_commands()
        
        # Return True if ready
        return (
            len(self.results['core']['missing']) == 0 and
            len(self.results['ai']['missing']) == 0 and
            len(self.results['extra']['missing']) == 0
        )

def main():
    """Main function"""
    try:
        # Install psutil if not available (for better system info)
        try:
            import psutil
        except ImportError:
            print(f"{Colors.YELLOW}Installing psutil for better system information...{Colors.ENDC}")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "psutil"])
        
        checker = NeuralVisionDependencyChecker()
        system_ready = checker.run_all_checks()
        
        # Exit with appropriate code
        sys.exit(0 if system_ready else 1)
        
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Check interrupted by user{Colors.ENDC}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.RED}Unexpected error: {str(e)}{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()