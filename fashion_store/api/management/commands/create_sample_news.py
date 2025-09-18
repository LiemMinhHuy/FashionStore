from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import NewsCategory, News, User
from datetime import timedelta

class Command(BaseCommand):
    help = 'Create sample news categories and articles'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample news data...')
        
        # Create news categories
        categories_data = [
            {
                'name': 'Fashion Trends',
                'description': 'Latest fashion trends and style updates',
                'color': '#FF6B6B',
                'icon': 'fas fa-tshirt'
            },
            {
                'name': 'New Arrivals',
                'description': 'Information about new products and collections',
                'color': '#4ECDC4',
                'icon': 'fas fa-sparkles'
            },
            {
                'name': 'Style Guide',
                'description': 'Fashion tips and styling advice',
                'color': '#45B7D1',
                'icon': 'fas fa-magic'
            },
            {
                'name': 'Behind the Scenes',
                'description': 'Company news and behind-the-scenes content',
                'color': '#96CEB4',
                'icon': 'fas fa-camera'
            },
            {
                'name': 'Sale & Promotions',
                'description': 'Sales announcements and promotional content',
                'color': '#FECA57',
                'icon': 'fas fa-tags'
            }
        ]
        
        categories = []
        for cat_data in categories_data:
            category, created = NewsCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            categories.append(category)
            if created:
                self.stdout.write(f'Created category: {category.name}')
        
        # Get or create an admin user for authoring articles
        admin_user = User.objects.filter(is_staff=True).first()
        if not admin_user:
            admin_user = User.objects.create_user(
                username='admin',
                email='admin@fashionstore.com',
                password='admin123',
                first_name='Admin',
                last_name='User',
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write('Created admin user for authoring articles')
        
        # Create sample articles
        articles_data = [
            {
                'title': 'What to Wear in Da Lat: 51+ Trendy Outfit Ideas for Perfect Travel Photos',
                'summary': 'Looking for stylish outfit ideas for your Da Lat getaway? For women, try pairing flowy skirts with soft T-shirts or cozy cardigans for a feminine touch.',
                'content': '''
                    <h2>What to Pack for a Da Lat Trip</h2>
                    <p>Known as the “city of flowers,” Da Lat offers cool weather year-round, making it perfect for stylish layered outfits. To enjoy your trip comfortably, prepare clothing that suits both the climate and your planned activities:</p>
                    <ul>
                    <li><strong>Warm Layers:</strong> Light jackets, sweaters, cardigans, or blazers to handle chilly evenings.</li>
                    <li><strong>Comfortable Footwear:</strong> Sneakers, low boots, or slip-ons for exploring the city’s hilly streets.</li>
                    <li><strong>Key Accessories:</strong> Scarves, beanies, or berets for warmth and a stylish touch.</li>
                    <li><strong>Easy Mix & Match:</strong> Basics like jeans, T-shirts, skirts, and versatile outerwear.</li>
                    <li><strong>Photo-Ready Pieces:</strong> Vintage or street-style outfits for cafés and check-in spots.</li>
                    <li><strong>Compact Bags:</strong> Crossbody or tote bags to keep essentials handy.</li>
                    <li><strong>Rain Protection:</strong> A small umbrella or raincoat for sudden showers.</li>
                    </ul>

                    <h2>Chic Outfit Ideas for Women</h2>
                    <ul>
                    <li><strong>Maxi Skirt + Shirt + Tank Top:</strong> A feminine, layered look perfect for cool mornings and evenings. Pair with a leather bag and pointed-toe shoes.</li>
                    <li><strong>Brown Skirt + Statement Blouse:</strong> Neutral tones create a sophisticated vibe, ideal for café hopping. Finish with white sneakers for a modern touch.</li>
                    <li><strong>Skirt + T-Shirt + Cardigan:</strong> A pastel cardigan over a simple tee and long skirt balances warmth and style.</li>
                    <li><strong>Denim on Denim:</strong> Wide-leg jeans with a denim jacket and a crisp white tee bring casual edge and warmth.</li>
                    <li><strong>Routine Favorites:</strong> Black wide-leg pants with a fitted tee and cropped jacket for a sleek look, or an oversized red sweater with a pleated white skirt for playful energy.</li>
                    <li><strong>Winter-Ready Layers:</strong> Cream puffer jacket, turtleneck sweater, wide jeans, and sporty sneakers for extra warmth.</li>
                    <li><strong>Retro Vibes:</strong> Striped sweater with wide-leg jeans, mini crossbody bag, and sunglasses for vintage-inspired photos.</li>
                    </ul>

                    <h2>Stylish Outfit Ideas for Men</h2>
                    <ul>
                    <li><strong>Denim on Denim:</strong> A dark denim jacket and matching jeans with rolled sleeves, paired with chunky leather boots for rugged charm.</li>
                    <li><strong>Summer Smart Casual:</strong> Light-blue Oxford shirt with beige chinos for a fresh, refined look. Tuck in the shirt for added polish.</li>
                    <li><strong>Layered Winter Look:</strong> White shirt, black denim jacket, and cream quilted vest for cozy style. Add sneakers for easy movement.</li>
                    <li><strong>Jeans + Polo Sweater:</strong> Wide-leg jeans with a polo-neck sweater and a draped jacket over the shoulders for a sophisticated yet relaxed vibe.</li>
                    </ul>

                    <h2>Extra Tips</h2>
                    <p>Accessorize with sunglasses, scarves, and crossbody bags to elevate your outfits. Whether strolling through vintage cafés or capturing photo-worthy moments, these mix-and-match looks ensure you stay warm, stylish, and Instagram-ready throughout your Da Lat adventure.</p>

                ''',

                'image': 'https://res.cloudinary.com/ddoebyozj/image/upload/v1758207011/fashion_store/Blog/blog1.png',
                'category': categories[0],  # Fashion Trends
                'tags': 'Da Lat fashion, travel outfits, layered style, photo-ready looks',
                'is_published': True,
                'is_featured': True,
                'meta_title': 'What to Wear in Da Lat: 51+ Trendy Outfit Ideas for Travel',
                'meta_description': 'Discover stylish outfit ideas for your Da Lat getaway. From flowy skirts to cozy cardigans, get perfect travel photo looks for the city of flowers.'
            },
            {
                'title': 'What Is Punk Style? The Bold and Rebellious Fashion Trend',
                'summary': 'Punk fashion is the ultimate symbol of individuality and rebellion. Discover what defines Punk style, from its 1970s rock-inspired roots to modern interpretations.',
                'content': '''
                    <h2>What Is Punk Style?</h2>
                <p>Punk style is a bold fashion movement that reflects fearless individuality and a rebellious spirit. More than just a trend, it conveys a strong message of freedom and defiance against societal rules. Characterized by ripped denim, edgy graphic tees, leather jackets, heavy boots, and studded accessories, Punk style thrives on mixing unexpected elements without following any norms. Hairstyles such as brightly dyed mohawks or sharp buzz cuts add an unmistakable finishing touch.</p>

                <h2>Cultural Origins of Punk Fashion</h2>
                <p>Emerging in the 1970s across the UK, USA, France, and Australia, Punk fashion rose alongside Punk Rock music as a form of social protest. In an era of economic hardship and strict social expectations, young people used Punk as a way to express frustration and claim independence. Legendary bands like The Ramones, Sex Pistols, and The Clash helped shape this rebellious aesthetic, pairing loud music with ripped clothing, metal spikes, and striking haircuts. Over time, Punk evolved into a more refined yet still daring style, balancing edge with modern trends while preserving its signature attitude.</p>

                <h2>Key Elements of Punk Style</h2>
                <ul>
                <li><strong>Ripped denim &amp; leather jackets:</strong> Classic symbols of defiance and toughness.</li>
                <li><strong>Studded accessories:</strong> Chains, chokers, and spiked jewelry that command attention.</li>
                <li><strong>Bold hairstyles:</strong> Mohawks, vibrant colors, and dramatic cuts that celebrate individuality.</li>
                <li><strong>Heavy footwear:</strong> Combat boots and platform shoes to anchor the look with power.</li>
                </ul>

                <h2>Popular Punk Variations</h2>
                <ul>
                <li><strong>Street Punk:</strong> A gritty mix of streetwear and traditional Punk, featuring denim, leather, studs, and combat boots for a rugged urban vibe.</li>
                <li><strong>Glam Punk:</strong> A fusion of Punk’s rebellious edge with the glitz of Glam Rock, highlighted by bright colors, metallic fabrics, and bold patterns.</li>
                <li><strong>Pop Punk:</strong> A more approachable style inspired by bands like Green Day and Blink-182, favoring graphic tees, skinny jeans, and sneakers for a casual yet edgy look.</li>
                <li><strong>Hardcore Punk:</strong> Minimalist and unisex, focusing on functional clothing with fewer accessories, perfect for everyday wear while keeping the Punk spirit alive.</li>
                </ul>

                <h2>Modern Appeal</h2>
                <p>Today, Punk fashion remains a symbol of independence and creativity. From studded jackets to chain-detailed bags and fishnet layers, each wearer can adapt Punk to their own lifestyle, creating an expressive, fearless aesthetic that stands the test of time.</p>

                ''',
                'image': 'https://res.cloudinary.com/ddoebyozj/image/upload/v1758207042/fashion_store/Blog/blog2.png',
                'category': categories[1],  # New Arrivals
                'tags': 'punk style, rebellion fashion, edgy looks, street style',
                'is_published': True,
                'is_featured': True,
                'meta_title': 'What Is Punk Style? The Bold and Rebellious Fashion Trend',
                'meta_description': 'Discover Punk fashion - the ultimate symbol of individuality and rebellion. Learn about 1970s rock-inspired roots to modern interpretations.'
            },
            {
                'title': 'Old Money: What Is It? The Aristocratic, High-Class Fashion Style',
                'summary': 'Discover the essence of Old Money style – a fashion trend that exudes timeless elegance, quiet luxury, and understated power. Explore styling tips with blazers, tailored trousers, and classic accessories to create a sophisticated, high-class look for every occasion.',
                'content': '''
                    <h2>1. What Is the Old Money Style?</h2>
                    <p><strong>1.1. Definition</strong><br>
                    Old Money refers to families who have preserved wealth for generations. Unlike “New Money,”
                    which often flaunts flashy logos and trends, Old Money values quiet elegance.
                    It highlights understated luxury with timeless designs, premium materials,
                    and refined tailoring that express class without showing off.</p>

                    <p><strong>1.2. Origins</strong><br>
                    The Old Money aesthetic originated among European aristocracy—particularly in 19th-century
                    England and France. Royal families, dukes, and counts influenced this discreet yet
                    sophisticated look. In the United States, elite dynasties such as the Rockefellers,
                    Vanderbilts, Astors, and Carnegies embraced bespoke tailoring and minimalist silhouettes,
                    setting a lasting standard for refined living. 
                    Despite changing times, Old Money style remains synonymous with grace, poise, and timeless luxury.</p>

                    <p><strong>1.3. A Symbol of Elegance and Class</strong><br>
                    Old Money wardrobes convey status through quality and subtlety rather than large logos.
                    Followers favor neutral palettes, superior fabrics, and classic cuts paired with minimal,
                    high-quality accessories. The essence extends beyond clothing: calm confidence,
                    polished manners, and an effortlessly refined lifestyle embody this enduring aesthetic.</p>

                    <h2>2. Key Characteristics of Old Money Fashion</h2>
                    <ul>
                    <li><strong>Neutral, understated colors:</strong> Shades like white, black, beige, navy,
                        gray, and rich browns create a sophisticated, never-dated look.</li>
                    <li><strong>Premium, long-lasting fabrics:</strong> Cashmere, silk, organic cotton,
                        tweed, and linen provide comfort and an unmistakable sense of luxury.</li>
                    <li><strong>Classic, minimalist cuts:</strong> Tailored blazers, trench coats,
                        relaxed-fit trousers, crisp shirts, and elegant midi skirts showcase careful craftsmanship.</li>
                    <li><strong>Discreet branding:</strong> Quality and fit speak louder than visible logos
                        or extravagant patterns.</li>
                    <li><strong>Composed demeanor:</strong> A calm, confident attitude and refined
                        etiquette complete the Old Money impression.</li>
                    </ul>

                    <p>If you are seeking neutral-toned, high-quality pieces with timeless designs,
                    explore Routine’s latest collections to create a wardrobe that captures
                    the essence of Old Money sophistication.</p>
                ''',
                'image': 'https://res.cloudinary.com/ddoebyozj/image/upload/v1758207071/fashion_store/Blog/blog3.png',
                'category': categories[2],  # Style Guide
                'tags': 'old money style, aristocratic fashion, timeless elegance, luxury fashion',
                'is_published': True,
                'is_featured': False,
                'meta_title': 'Old Money Style: The Aristocratic, High-Class Fashion Trend',
                'meta_description': 'Discover Old Money style - timeless elegance, quiet luxury, and understated power. Styling tips with blazers, tailored trousers, and classic accessories.'
            },
            {
                'title': 'What Is a Jumper? The Ultimate Guide to Styling Jumpers for Men and Women',
                'summary': 'Discover what a jumper is and how to style this timeless piece for every occasion. Learn about the most popular jumper designs—crew neck, V-neck, turtleneck, cropped, and oversized—and get easy outfit ideas to create versatile, on-trend looks for both men and women.',
                'content': '''
                    <h2>1. What Is a Jumper?</h2>
                    <p>A jumper is a long-sleeved sweater or fleece typically worn during the fall and winter seasons to stay warm. It has no buttons or zippers and is designed to be pulled over the head, providing both comfort and insulation. Jumpers range from fitted to oversized styles, but all share the goal of keeping the wearer cozy in chilly weather.</p>

                    <h2>2. Popular Types of Jumpers</h2>
                    <p>Jumpers come in a wide variety of designs, from simple classics to bold patterns and colors. Some of the most common styles include:</p>
                    <ul>
                    <li><strong>Turtleneck Jumper:</strong> Features a high, close-fitting collar for extra warmth and a sophisticated look. Materials range from thick wool for winter to lightweight cotton for milder days.</li>
                    <li><strong>Crew Neck Jumper:</strong> A timeless, minimalist design ideal for anyone new to fall and winter fashion.</li>
                    <li><strong>V-Neck Jumper:</strong> Offers a flattering neckline and pairs well with shirts or tees underneath.</li>
                    <li><strong>Strappy Jumper Dress:</strong> A sleeveless, overall-inspired design that layers perfectly over shirts or turtlenecks.</li>
                    <li><strong>Short Jumper Dress:</strong> Features a deep V-neck for a chic, fashion-forward touch.</li>
                    <li><strong>Vest-Style Jumper:</strong> Similar to a knitted vest with a V-neck and contrast trim for added personality.</li>
                    <li><strong>Midi Jumper Dress:</strong> Combines the comfort of a jumper with the elegance of a midi skirt for a relaxed yet stylish outfit.</li>
                    <li><strong>Patterned Jumper:</strong> Embellished with standout prints, embroidery, or classic motifs like polka dots, stars, and checks to showcase individuality.</li>
                    </ul>

                    <h2>3. How Jumpers Differ from Other Garments</h2>
                    <ul>
                    <li><strong>Jumper vs. Sweater:</strong> They are essentially the same garment. “Sweater” is the American term, while “jumper” is commonly used in British English.</li>
                    <li><strong>Jumper vs. Jumpsuit vs. Romper:</strong> A jumper is a pullover sweater or dress, while a jumpsuit is a one-piece outfit combining a top and long pants. A romper is similar to a jumpsuit but features shorts instead of full-length pants, making it perfect for warm-weather outings.</li>
                    </ul>

                    <h2>4. Styling Tips for Men</h2>
                    <p>Jumpers are versatile wardrobe staples for men, easily paired with various pieces to create unique looks:</p>
                    <ul>
                    <li><strong>Jumper + Jeans:</strong> A classic, timeless combo. Pair a neutral-colored jumper with straight or slim-fit jeans for a casual yet stylish outfit.</li>
                    <li><strong>Jumper + Shirt + Dress Pants:</strong> Layer a crew or turtleneck jumper over a shirt and add tailored trousers for an elegant office or meeting-ready look.</li>
                    <li><strong>Jumper + Jacket:</strong> Add a leather or fabric jacket over a jumper for a bold, contemporary style—perfect for outdoor activities in cooler months.</li>
                    <li><strong>Jumper + Blazer:</strong> Ideal for business settings or dinner dates. A simple jumper under a well-fitted blazer creates a polished yet comfortable ensemble.</li>
                    <li><strong>Jumper + Long Coat:</strong> Combine a turtleneck jumper with a long overcoat for maximum warmth and a refined, winter-ready appearance.</li>
                    </ul>
                ''',
                'image': 'https://res.cloudinary.com/ddoebyozj/image/upload/v1758207082/fashion_store/Blog/blog4.png',
                'category': categories[3],  # Behind the Scenes
                'tags': 'jumper styling, sweater guide, winter fashion, layering tips',
                'is_published': True,
                'is_featured': False,
                'meta_title': 'What Is a Jumper? Ultimate Guide to Styling Jumpers for Men and Women',
                'meta_description': 'Discover what a jumper is and how to style this timeless piece. Learn about popular designs and get easy outfit ideas for versatile, on-trend looks.'
            },
            {
                'title': 'Minimalist Fashion: The Art of Effortless Style and Conscious Living',
                'summary': 'Explore the philosophy of minimalist fashion – where less is more. Discover how to build a capsule wardrobe with quality basics, neutral colors, and timeless pieces that create endless stylish combinations while promoting sustainable living.',
                'content': '''
                    <h2>1. What Is Minimalist Fashion?</h2>
                    <p><strong>1.1. Definition</strong><br>
                    Minimalist fashion is a style philosophy that prioritizes quality over quantity, focusing on essential pieces that can be mixed and matched effortlessly. It emphasizes clean lines, neutral colors, and timeless designs that transcend seasonal trends. The goal is to create a curated wardrobe where every piece serves multiple purposes and reflects personal style without excess.</p>

                    <p><strong>1.2. Origins and Philosophy</strong><br>
                    Minimalist fashion emerged from the broader minimalist movement of the 1960s, influenced by Japanese aesthetics and Scandinavian design principles. Designers like Jil Sander, Calvin Klein, and The Row pioneered this approach, proving that simplicity could be luxurious. The philosophy extends beyond clothing to encompass mindful consumption, environmental consciousness, and the idea that true style comes from confidence rather than complicated outfits.</p>

                    <p><strong>1.3. Benefits of Minimalist Dressing</strong><br>
                    A minimalist wardrobe reduces decision fatigue, saves money in the long run, and promotes sustainability. By investing in fewer, higher-quality pieces, you create a more intentional relationship with fashion while maintaining a consistently polished appearance. This approach also supports ethical fashion practices and reduces environmental impact.</p>

                    <h2>2. Building Your Minimalist Wardrobe</h2>
                    <ul>
                    <li><strong>Essential basics:</strong> White button-down shirts, well-fitted jeans, quality t-shirts, and versatile blazers form the foundation.</li>
                    <li><strong>Neutral color palette:</strong> Stick to black, white, gray, beige, navy, and camel for maximum mix-and-match potential.</li>
                    <li><strong>Quality over quantity:</strong> Invest in well-made pieces from sustainable materials that will last for years.</li>
                    <li><strong>Versatile silhouettes:</strong> Choose classic cuts that work for multiple occasions and body types.</li>
                    <li><strong>Mindful accessories:</strong> Select a few high-quality accessories that can elevate any outfit.</li>
                    </ul>

                    <h2>3. Styling Tips for Minimalist Fashion</h2>
                    <ul>
                    <li><strong>Layer strategically:</strong> Use different textures and proportions to create interest without patterns.</li>
                    <li><strong>Focus on fit:</strong> Proper tailoring makes even simple pieces look expensive and polished.</li>
                    <li><strong>Add subtle details:</strong> Interesting necklines, quality buttons, or premium fabrics can elevate basic pieces.</li>
                    <li><strong>Master the art of proportion:</strong> Balance oversized and fitted pieces for dynamic silhouettes.</li>
                    </ul>

                    <p>Minimalist fashion proves that you don't need a closet full of clothes to look stylish. By choosing thoughtfully and investing in quality, you can create a wardrobe that truly reflects your personal style while supporting sustainable fashion practices.</p>
                ''',
                'image': 'https://res.cloudinary.com/ddoebyozj/image/upload/v1758207089/fashion_store/Blog/blog5.png',
                'category': categories[4],  # Sale & Promotions
                'tags': 'minimalist fashion, capsule wardrobe, sustainable style, quality basics',
                'is_published': True,
                'is_featured': True,
                'meta_title': 'Minimalist Fashion: The Art of Effortless Style and Conscious Living',
                'meta_description': 'Explore minimalist fashion philosophy - build a capsule wardrobe with quality basics, neutral colors, and timeless pieces for effortless style.'
            }
        ]
        
        # Create articles
        for i, article_data in enumerate(articles_data):
            # Set published_at to different dates
            published_date = timezone.now() - timedelta(days=i*2)
            
            article, created = News.objects.get_or_create(
                title=article_data['title'],
                defaults={
                    **article_data,
                    'author': admin_user,
                    'published_at': published_date if article_data['is_published'] else None
                }
            )
            
            if created:
                self.stdout.write(f'Created article: {article.title}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(categories)} categories and {len(articles_data)} articles!'
            )
        )