import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class SustainabilityResourcesScreen extends StatefulWidget {
  const SustainabilityResourcesScreen({Key? key}) : super(key: key);

  @override
  State<SustainabilityResourcesScreen> createState() =>
      _SustainabilityResourcesScreenState();
}

class _SustainabilityResourcesScreenState
    extends State<SustainabilityResourcesScreen> {
  final List<Map<String, String>> sustainabilityWebsites = [
    {
      'name': 'Ecosia',
      'description': 'Search the web and plant trees with every search.',
      'url': 'https://www.ecosia.org/',
    },
    {
      'name': 'Ecologi',
      'description': 'Offset your carbon footprint and fund reforestation.',
      'url': 'https://ecologi.com/',
    },
    {
      'name': 'Ethical Superstore',
      'description': 'Shop ethically sourced, eco-friendly products.',
      'url': 'https://www.ethicalsuperstore.com/',
    },
    {
      'name': 'Plastic Bank',
      'description': 'Turn plastic waste into currency to fight ocean plastic.',
      'url': 'https://plasticbank.com/',
    },
    {
      'name': 'Octopus Energy',
      'description': 'Affordable renewable energy for homes.',
      'url': 'https://octopus.energy/',
    },
  ];

  final List<Map<String, String>> sustainabilityArticles = [
    {
      'title': '12 Ways to Live More Sustainably',
      'url':
      'https://www.goingzerowaste.com/',
    },
    {
      'title': 'Everyday Eco Update and Sustainability Newsletter ',
      'url': 'https://trellis.net/',
    },
    {
      'title': 'Best ways to save water',
      'url': 'https://wateruseitwisely.com/',
    },
    {
      'title': 'Inspiring Sustainable Living Blogs 2025',
      'url': 'https://www.treehugger.com/',
    },
    {
      'title': 'Tested energy saving methodologies',
      'url': 'https://www.energy.gov/energysaver/energy-saver',
    },
  ];

  void _launchURL(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      throw 'Could not launch $url';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0C7C72), // Deep green background
      appBar: AppBar(
        title: const Text('Sustainability Resources'),
        backgroundColor: Colors.teal[700],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            '🌱 Websites Promoting Sustainability',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 10),
          ...sustainabilityWebsites.asMap().entries.map((entry) {
            int index = entry.key;
            var site = entry.value;
            return AnimatedCard(
              delay: index * 200,
              child: Card(
                color: Colors.grey.withOpacity(0.2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 3,
                margin: const EdgeInsets.symmetric(vertical: 8),
                child: ListTile(
                  title: Text(
                    site['name']!,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  subtitle: Text(
                    site['description']!,
                    style: const TextStyle(color: Colors.white),
                  ),
                  trailing: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.yellow[700],
                      foregroundColor: Colors.black,
                    ),
                    onPressed: () => _launchURL(site['url']!),
                    child: const Text('Visit'),
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 20),
          const Text(
            '📘 Learn About Sustainability',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 10),
          ...sustainabilityArticles.asMap().entries.map((entry) {
            int index = entry.key;
            var article = entry.value;
            return AnimatedCard(
              delay: index * 200,
              child: Card(
                color: Colors.grey.withOpacity(0.2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                margin: const EdgeInsets.symmetric(vertical: 6),
                child: ListTile(
                  title: Text(
                    article['title']!,
                    style: const TextStyle(color: Colors.white),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.open_in_new, color: Colors.white),
                    onPressed: () => _launchURL(article['url']!),
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class AnimatedCard extends StatefulWidget {
  final Widget child;
  final int delay;

  const AnimatedCard({required this.child, required this.delay, Key? key})
      : super(key: key);

  @override
  State<AnimatedCard> createState() => _AnimatedCardState();
}

class _AnimatedCardState extends State<AnimatedCard>
    with SingleTickerProviderStateMixin {
  double opacity = 0.0;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) {
        setState(() {
          opacity = 1.0;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 600),
      opacity: opacity,
      curve: Curves.easeIn,
      child: widget.child,
    );
  }
}

