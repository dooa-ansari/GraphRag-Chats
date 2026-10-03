"""Sample data loaded automatically on first run (see main.lifespan), so a
fresh clone has something to open instead of an empty graph list.

Example graphs:
- FAMILY_GRAPH: a three-generation family tree with parent/child, spouse,
  sibling, cousin and grandparent edges.
- GROCERY_GRAPH: a grocery catalog (products, categories, brands,
  ingredients, allergens) with enough detail for queries like "gmo free,
  seed oil free, chocolate flavour protein bar without any sugar".
- FAQ_GRAPH: a company FAQ knowledge base (categories, plans, policies,
  cross-linked questions) for queries like "I'm on the free plan and ran
  out of storage, can I still share links that don't expire?".
- RESUME_GRAPH: a software developer's resume (education, work experience,
  skills, certifications, projects) for queries like "find an engineer
  with Python and AWS experience who built a RAG system".
- BOOK_GRAPH: a library catalog (books, authors, genres, publishers, series)
  with availability/length/rating on each book, for queries like "a fantasy
  novel under 450 pages that's available right now, by an award-winning
  author".
- MOVIE_GRAPH: a movie recommendation catalog (movies, directors, actors,
  studios, streaming platforms) with mood tags, runtime and scores, for
  queries like "a mind-bending sci-fi movie under two hours on StreamVault".
"""

import re

from backend.schemas import (
    GraphEdge,
    GraphNode,
    GraphNodeData,
    NodeProperty,
    Position,
    SaveGraphRequest,
)


def _person(
    node_id: str,
    name: str,
    x: float,
    y: float,
    *,
    gender: str,
    age: int,
    occupation: str,
    description: str,
) -> GraphNode:
    return GraphNode(
        id=node_id,
        type="graph",
        position=Position(x=x, y=y),
        data=GraphNodeData(
            name=name,
            type="Person",
            description=description,
            properties=[
                NodeProperty(name="gender", value=gender),
                NodeProperty(name="age", value=str(age)),
                NodeProperty(name="occupation", value=occupation),
            ],
        ),
    )


def _rel(edge_id: str, source: str, target: str, relationship: str) -> GraphEdge:
    return GraphEdge(id=edge_id, source=source, target=target, relationship=relationship)


FAMILY_GRAPH = SaveGraphRequest(
    name="Smith Family Tree",
    nodes=[
        # Generation 1
        _person(
            "seed-robert", "Robert Smith", 400, 0,
            gender="male", age=72, occupation="Retired Engineer",
            description="Patriarch of the Smith family.",
        ),
        _person(
            "seed-mary", "Mary Smith", 750, 0,
            gender="female", age=70, occupation="Retired Teacher",
            description="Matriarch of the Smith family.",
        ),
        # Generation 2
        _person(
            "seed-james", "James Smith", 150, 320,
            gender="male", age=45, occupation="Software Engineer",
            description="Robert and Mary's eldest child.",
        ),
        _person(
            "seed-linda", "Linda Smith", 480, 320,
            gender="female", age=43, occupation="Doctor",
            description="James's wife; works at the city hospital.",
        ),
        _person(
            "seed-patricia", "Patricia Johnson", 850, 320,
            gender="female", age=41, occupation="Lawyer",
            description="Robert and Mary's younger child.",
        ),
        _person(
            "seed-michael", "Michael Johnson", 1180, 320,
            gender="male", age=42, occupation="Architect",
            description="Patricia's husband.",
        ),
        # Generation 3
        _person(
            "seed-emily", "Emily Smith", 0, 640,
            gender="female", age=16, occupation="Student",
            description="James and Linda's eldest daughter; loves painting.",
        ),
        _person(
            "seed-daniel", "Daniel Smith", 330, 640,
            gender="male", age=13, occupation="Student",
            description="James and Linda's son; plays the violin.",
        ),
        _person(
            "seed-sophia", "Sophia Johnson", 700, 640,
            gender="female", age=14, occupation="Student",
            description="Patricia and Michael's daughter; on the school swim team.",
        ),
        _person(
            "seed-ethan", "Ethan Johnson", 1030, 640,
            gender="male", age=11, occupation="Student",
            description="Patricia and Michael's son; loves dinosaurs.",
        ),
    ],
    edges=[
        # Spouses
        _rel("seed-e1", "seed-robert", "seed-mary", "Spouse"),
        _rel("seed-e2", "seed-james", "seed-linda", "Spouse"),
        _rel("seed-e3", "seed-patricia", "seed-michael", "Spouse"),
        # Parents -> generation 2
        _rel("seed-e4", "seed-robert", "seed-james", "Father"),
        _rel("seed-e5", "seed-mary", "seed-james", "Mother"),
        _rel("seed-e6", "seed-robert", "seed-patricia", "Father"),
        _rel("seed-e7", "seed-mary", "seed-patricia", "Mother"),
        # Parents -> generation 3
        _rel("seed-e8", "seed-james", "seed-emily", "Father"),
        _rel("seed-e9", "seed-linda", "seed-emily", "Mother"),
        _rel("seed-e10", "seed-james", "seed-daniel", "Father"),
        _rel("seed-e11", "seed-linda", "seed-daniel", "Mother"),
        _rel("seed-e12", "seed-michael", "seed-sophia", "Father"),
        _rel("seed-e13", "seed-patricia", "seed-sophia", "Mother"),
        _rel("seed-e14", "seed-michael", "seed-ethan", "Father"),
        _rel("seed-e15", "seed-patricia", "seed-ethan", "Mother"),
        # Siblings
        _rel("seed-e16", "seed-james", "seed-patricia", "Sibling"),
        _rel("seed-e17", "seed-emily", "seed-daniel", "Sibling"),
        _rel("seed-e18", "seed-sophia", "seed-ethan", "Sibling"),
        # Cousins
        _rel("seed-e19", "seed-emily", "seed-sophia", "Cousin"),
        _rel("seed-e20", "seed-emily", "seed-ethan", "Cousin"),
        _rel("seed-e21", "seed-daniel", "seed-sophia", "Cousin"),
        _rel("seed-e22", "seed-daniel", "seed-ethan", "Cousin"),
        # Grandparents (direct edges, not just inferred through two parent hops)
        _rel("seed-e23", "seed-robert", "seed-emily", "Grandfather"),
        _rel("seed-e24", "seed-robert", "seed-daniel", "Grandfather"),
        _rel("seed-e25", "seed-robert", "seed-sophia", "Grandfather"),
        _rel("seed-e26", "seed-robert", "seed-ethan", "Grandfather"),
        _rel("seed-e27", "seed-mary", "seed-emily", "Grandmother"),
        _rel("seed-e28", "seed-mary", "seed-daniel", "Grandmother"),
        _rel("seed-e29", "seed-mary", "seed-sophia", "Grandmother"),
        _rel("seed-e30", "seed-mary", "seed-ethan", "Grandmother"),
    ],
)


# --- Grocery catalog -------------------------------------------------------
# Built from flat name lists + a product table rather than hand-written node
# ids, so adding/editing a product can't silently desync ingredient/allergen
# edges from the nodes they point to.

def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _node(
    node_id: str,
    name: str,
    node_type: str,
    x: float,
    y: float,
    *,
    description: str = "",
    properties: list[NodeProperty] | None = None,
) -> GraphNode:
    return GraphNode(
        id=node_id,
        type="graph",
        position=Position(x=x, y=y),
        data=GraphNodeData(
            name=name,
            type=node_type,
            description=description,
            properties=properties or [],
        ),
    )


CATEGORIES = ["Protein Bars", "Dairy & Eggs", "Frozen Food", "Snacks", "Beverages"]

BRANDS = [
    "PureFuel", "NatureBar", "MaxGain", "GreenPasture Farms", "Happy Hen Farms",
    "NutPure", "FreshFreeze", "BellaKitchen", "FarmCrisp", "RootSnacks",
    "CrispCo", "BrewWorks", "SunSqueeze",
]

ALLERGENS = ["Milk", "Tree Nuts", "Peanuts", "Soy", "Gluten", "Eggs"]

INGREDIENTS = [
    "Whey Protein Isolate", "Pea Protein", "Soy Protein Isolate", "Peanut Protein",
    "Peanut Butter", "Cocoa Powder", "Almond Butter", "Stevia", "Monk Fruit Extract",
    "Coconut Oil", "Canola Oil", "Sunflower Oil", "Avocado Oil", "Cane Sugar",
    "Brown Rice Syrup", "Vanilla Extract", "Wheat Flour", "Mozzarella Cheese",
    "Tomato Sauce", "Basil", "Potatoes", "Sea Salt", "Almonds", "Dark Chocolate",
    "Whole Milk", "Water", "Chicken Breast", "Breadcrumbs", "Carrots", "Peas",
    "Corn", "Coffee Beans", "Oranges",
]

# Deliberately includes near-misses (e.g. a chocolate protein bar that still
# has sugar and soy) so a search like "gmo free, seed oil free, chocolate
# flavour protein bar without any sugar" has to tell products apart, not
# just match on "chocolate protein bar".
PRODUCTS = [
    {
        "name": "ChocoFit Protein Bar",
        "description": "A chocolate-flavoured protein bar made with clean, simple ingredients — no added sugar, no seed oils, and no GMO ingredients.",
        "price": "2.99",
        "category": "Protein Bars",
        "brand": "PureFuel",
        "ingredients": ["Whey Protein Isolate", "Cocoa Powder", "Almond Butter", "Stevia", "Sea Salt"],
        "allergens": ["Milk", "Tree Nuts"],
        "flags": {"flavor": "chocolate", "protein": "12g", "gmoFree": "true", "seedOilFree": "true", "sugarFree": "true", "glutenFree": "true"},
    },
    {
        "name": "Peanut Crunch Protein Bar",
        "description": "A crunchy peanut butter protein bar sweetened with cane sugar.",
        "price": "2.49",
        "category": "Protein Bars",
        "brand": "PureFuel",
        "ingredients": ["Peanut Protein", "Peanut Butter", "Cane Sugar", "Sunflower Oil"],
        "allergens": ["Peanuts"],
        "flags": {"flavor": "peanut butter", "protein": "10g", "gmoFree": "false", "seedOilFree": "false", "sugarFree": "false"},
    },
    {
        "name": "Vanilla Clean Bar",
        "description": "An organic, plant-based vanilla protein bar with no GMOs, no seed oils, and no added sugar.",
        "price": "3.49",
        "category": "Protein Bars",
        "brand": "NatureBar",
        "ingredients": ["Pea Protein", "Vanilla Extract", "Coconut Oil", "Monk Fruit Extract"],
        "allergens": [],
        "flags": {"flavor": "vanilla", "protein": "11g", "gmoFree": "true", "seedOilFree": "true", "sugarFree": "true", "organic": "true"},
    },
    {
        "name": "Chocolate Brownie Protein Bar",
        "description": "A rich chocolate brownie-flavoured protein bar made with soy protein and brown rice syrup.",
        "price": "2.29",
        "category": "Protein Bars",
        "brand": "MaxGain",
        "ingredients": ["Soy Protein Isolate", "Cocoa Powder", "Brown Rice Syrup", "Canola Oil"],
        "allergens": ["Soy"],
        "flags": {"flavor": "chocolate", "protein": "9g", "gmoFree": "false", "seedOilFree": "false", "sugarFree": "false"},
    },
    {
        "name": "Organic Whole Milk",
        "description": "Organic whole milk from grass-fed, pasture-raised cows.",
        "price": "4.50",
        "category": "Dairy & Eggs",
        "brand": "GreenPasture Farms",
        "ingredients": ["Whole Milk"],
        "allergens": ["Milk"],
        "flags": {"organic": "true", "size": "1 gallon"},
    },
    {
        "name": "Lactose-Free 2% Milk",
        "description": "Easy-to-digest 2% milk with the lactose removed, same great taste.",
        "price": "4.20",
        "category": "Dairy & Eggs",
        "brand": "GreenPasture Farms",
        "ingredients": ["Whole Milk"],
        "allergens": ["Milk"],
        "flags": {"lactoseFree": "true", "size": "1 gallon"},
    },
    {
        "name": "Free-Range Eggs (Dozen)",
        "description": "A dozen eggs from free-range, pasture-raised hens.",
        "price": "5.99",
        "category": "Dairy & Eggs",
        "brand": "Happy Hen Farms",
        "ingredients": [],
        "allergens": ["Eggs"],
        "flags": {"organic": "true", "cageFree": "true"},
    },
    {
        "name": "Almond Milk Unsweetened",
        "description": "A dairy-free, plant-based milk alternative made from almonds, with no added sugar.",
        "price": "3.99",
        "category": "Dairy & Eggs",
        "brand": "NutPure",
        "ingredients": ["Almonds", "Water", "Sea Salt"],
        "allergens": ["Tree Nuts"],
        "flags": {"dairyFree": "true", "sugarFree": "true"},
    },
    {
        "name": "Frozen Mixed Vegetables",
        "description": "A GMO-free blend of organic carrots, peas, and corn, flash-frozen to lock in nutrients.",
        "price": "3.29",
        "category": "Frozen Food",
        "brand": "FreshFreeze",
        "ingredients": ["Carrots", "Peas", "Corn"],
        "allergens": [],
        "flags": {"organic": "true", "gmoFree": "true"},
    },
    {
        "name": "Frozen Margherita Pizza",
        "description": "A classic margherita pizza with mozzarella, tomato sauce, and basil on a wheat crust.",
        "price": "6.99",
        "category": "Frozen Food",
        "brand": "BellaKitchen",
        "ingredients": ["Wheat Flour", "Mozzarella Cheese", "Tomato Sauce", "Basil"],
        "allergens": ["Gluten", "Milk"],
        "flags": {"glutenFree": "false"},
    },
    {
        "name": "Frozen Chicken Nuggets",
        "description": "Breaded chicken breast nuggets, ready to bake.",
        "price": "5.49",
        "category": "Frozen Food",
        "brand": "FarmCrisp",
        "ingredients": ["Chicken Breast", "Wheat Flour", "Breadcrumbs", "Canola Oil"],
        "allergens": ["Gluten"],
        "flags": {"glutenFree": "false"},
    },
    {
        "name": "Seed-Oil-Free Potato Chips",
        "description": "Crispy potato chips cooked in avocado oil instead of seed oils, with no GMO ingredients.",
        "price": "3.99",
        "category": "Snacks",
        "brand": "RootSnacks",
        "ingredients": ["Potatoes", "Avocado Oil", "Sea Salt"],
        "allergens": [],
        "flags": {"gmoFree": "true", "seedOilFree": "true"},
    },
    {
        "name": "Classic Potato Chips",
        "description": "Crispy potato chips fried in sunflower oil.",
        "price": "2.99",
        "category": "Snacks",
        "brand": "CrispCo",
        "ingredients": ["Potatoes", "Sunflower Oil", "Sea Salt"],
        "allergens": [],
        "flags": {"gmoFree": "false", "seedOilFree": "false"},
    },
    {
        "name": "Dark Chocolate Almonds",
        "description": "Organic almonds coated in dark chocolate, with no GMO ingredients and no seed oils.",
        "price": "5.99",
        "category": "Snacks",
        "brand": "NatureBar",
        "ingredients": ["Almonds", "Dark Chocolate", "Cocoa Powder", "Cane Sugar"],
        "allergens": ["Tree Nuts"],
        "flags": {"flavor": "chocolate", "gmoFree": "true", "organic": "true", "seedOilFree": "true"},
    },
    {
        "name": "Cold Brew Coffee",
        "description": "Smooth, slow-steeped cold brew coffee with no added sugar.",
        "price": "3.49",
        "category": "Beverages",
        "brand": "BrewWorks",
        "ingredients": ["Coffee Beans", "Water"],
        "allergens": [],
        "flags": {"sugarFree": "true"},
    },
    {
        "name": "Orange Juice",
        "description": "100% fresh-squeezed orange juice with no added sugar.",
        "price": "4.49",
        "category": "Beverages",
        "brand": "SunSqueeze",
        "ingredients": ["Oranges"],
        "allergens": [],
        "flags": {"sugarFree": "true", "organic": "false"},
    },
]


def _build_grocery_graph() -> SaveGraphRequest:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    edge_counter = 0

    def next_edge_id() -> str:
        nonlocal edge_counter
        edge_counter += 1
        return f"seed-g-e{edge_counter}"

    category_ids = {name: f"seed-cat-{_slug(name)}" for name in CATEGORIES}
    brand_ids = {name: f"seed-brand-{_slug(name)}" for name in BRANDS}
    allergen_ids = {name: f"seed-allergen-{_slug(name)}" for name in ALLERGENS}
    ingredient_ids = {name: f"seed-ing-{_slug(name)}" for name in INGREDIENTS}

    for i, name in enumerate(CATEGORIES):
        nodes.append(_node(category_ids[name], name, "Category", i * 300, 0))

    for i, name in enumerate(BRANDS):
        nodes.append(_node(brand_ids[name], name, "Brand", i * 220, 240))

    for i, name in enumerate(ALLERGENS):
        nodes.append(
            _node(
                allergen_ids[name], name, "Allergen", i * 220, 1300,
                description=f"Products that contain {name.lower()} link here as a known allergen.",
            )
        )

    for i, name in enumerate(INGREDIENTS):
        nodes.append(_node(ingredient_ids[name], name, "Ingredient", i * 170, 1020))

    for i, product in enumerate(PRODUCTS):
        node_id = f"seed-prod-{_slug(product['name'])}"
        properties = [NodeProperty(name="price", value=f"${product['price']}")]
        for key, value in product["flags"].items():
            properties.append(NodeProperty(name=key, value=value))
        nodes.append(
            _node(
                node_id, product["name"], "Product", i * 280, 550,
                description=product["description"],
                properties=properties,
            )
        )
        edges.append(_rel(next_edge_id(), node_id, category_ids[product["category"]], "belongs to"))
        edges.append(_rel(next_edge_id(), node_id, brand_ids[product["brand"]], "is made by"))
        for ingredient in product["ingredients"]:
            edges.append(_rel(next_edge_id(), node_id, ingredient_ids[ingredient], "contains"))
        for allergen in product["allergens"]:
            edges.append(_rel(next_edge_id(), node_id, allergen_ids[allergen], "contains allergen"))

    return SaveGraphRequest(name="Grocery Store Catalog", nodes=nodes, edges=edges)


GROCERY_GRAPH = _build_grocery_graph()


# --- Company FAQ knowledge base --------------------------------------------
# A fictional cloud storage company ("Nimbus"). FAQs link to the plan and
# policy they're about (where relevant) and to other FAQs a user would
# naturally follow next, so a query like "I'm on the free plan and ran out
# of storage, can I still share links that don't expire?" pulls in both the
# storage-limit FAQ and the link-expiration FAQ via traversal.

COMPANY_NAME = "Nimbus Cloud Storage"

PLANS = [
    {
        "name": "Free",
        "price": "$0/month",
        "storage": "5GB",
        "devices": "2",
        "support": "Community forum",
    },
    {
        "name": "Pro",
        "price": "$9.99/month",
        "storage": "1TB",
        "devices": "Unlimited",
        "support": "Email support",
    },
    {
        "name": "Business",
        "price": "$12.99/user/month",
        "storage": "5TB pooled per team",
        "devices": "Unlimited",
        "support": "Priority support",
    },
    {
        "name": "Enterprise",
        "price": "Custom",
        "storage": "Unlimited (Fair Use Policy applies)",
        "devices": "Unlimited",
        "support": "Dedicated account manager",
    },
]

POLICIES = [
    {
        "name": "Refund Policy",
        "description": "Annual plans are covered by a 30-day money-back guarantee. After 30 days, Business and Enterprise refunds are prorated for unused months; Pro is non-refundable after that window.",
    },
    {
        "name": "Data Retention Policy",
        "description": "Deleted files are held in Trash for 30 days before being permanently erased. After permanent erasure, files cannot be recovered by the user or by support.",
    },
    {
        "name": "Fair Use Policy",
        "description": "Enterprise's unlimited storage has no fixed cap but is monitored for abuse; unusually large accounts may be flagged for manual review.",
    },
    {
        "name": "Privacy Policy",
        "description": "All files are encrypted in transit (TLS) and at rest (AES-256). Personal data and file contents are never sold to third parties.",
    },
    {
        "name": "Acceptable Use Policy",
        "description": "Accounts may not be used to store or distribute illegal content, malware, or material that infringes copyright; violations can lead to suspension.",
    },
]

CATEGORIES_FAQ = [
    "Billing & Subscriptions",
    "Account & Security",
    "Storage & Files",
    "Sharing & Collaboration",
    "Apps & Devices",
    "Troubleshooting",
]

FAQS = [
    {
        "question": "What happens if I exceed my storage limit on the Free plan?",
        "answer": "If you go over the 5GB limit on the Free plan, you can still access and download your existing files, but you won't be able to upload new files or sync changes until you free up space or upgrade to a paid plan.",
        "category": "Billing & Subscriptions",
        "plan": "Free",
    },
    {
        "question": "What happens if I exceed my storage limit on the Business plan?",
        "answer": "Business plan storage is pooled across your whole team. If the team exceeds its pooled limit, admins get notified and have 14 days to add storage or remove files before uploads are paused for the whole team.",
        "category": "Billing & Subscriptions",
        "plan": "Business",
    },
    {
        "question": "How do I upgrade from the Free plan to Pro?",
        "answer": "Open Settings > Plan & Billing, choose Pro, and enter your payment details. The upgrade takes effect immediately and your storage limit increases to 1TB right away.",
        "category": "Billing & Subscriptions",
        "plan": "Pro",
    },
    {
        "question": "Can I get a refund if I cancel my annual plan early?",
        "answer": "Yes. Annual plans are covered by our 30-day money-back guarantee — cancel within 30 days of purchase for a full refund. After that, refunds are prorated for unused months on Business and Enterprise plans only.",
        "category": "Billing & Subscriptions",
        "policy": "Refund Policy",
    },
    {
        "question": "What payment methods do you accept?",
        "answer": "We accept all major credit and debit cards, PayPal, and for Enterprise customers, invoicing with net-30 payment terms.",
        "category": "Billing & Subscriptions",
    },
    {
        "question": "Does my unused storage roll over if I downgrade my plan?",
        "answer": "No. Downgrading applies the new plan's storage limit immediately. If you're over the new limit, you'll have the same restrictions as exceeding a Free plan limit until you remove files or upgrade again.",
        "category": "Billing & Subscriptions",
        "related": ["What happens if I exceed my storage limit on the Free plan?"],
    },
    {
        "question": "How do I reset my password?",
        "answer": "Click 'Forgot password' on the sign-in page and enter your email address. We'll send a reset link that's valid for 60 minutes.",
        "category": "Account & Security",
    },
    {
        "question": "How do I enable two-factor authentication?",
        "answer": "Go to Settings > Security > Two-Factor Authentication and scan the QR code with an authenticator app like Google Authenticator or Authy.",
        "category": "Account & Security",
    },
    {
        "question": "What should I do if I think my account has been hacked?",
        "answer": "Reset your password immediately, revoke all active sessions under Settings > Security > Active Sessions, and enable two-factor authentication. Contact support if you see files you don't recognize.",
        "category": "Account & Security",
        "related": [
            "How do I reset my password?",
            "How do I enable two-factor authentication?",
        ],
    },
    {
        "question": "Is my data encrypted?",
        "answer": "Yes. All files are encrypted in transit with TLS and at rest with AES-256 encryption.",
        "category": "Account & Security",
        "policy": "Privacy Policy",
    },
    {
        "question": "Do you sell my data to third parties?",
        "answer": "No. We never sell your personal data or file contents to third parties. See our Privacy Policy for full details on what we collect and why.",
        "category": "Account & Security",
        "policy": "Privacy Policy",
    },
    {
        "question": "How do I delete my account permanently?",
        "answer": "Go to Settings > Account > Delete Account. This permanently deletes all your files and cannot be undone after the 30-day grace period described in our Data Retention Policy.",
        "category": "Account & Security",
        "policy": "Data Retention Policy",
    },
    {
        "question": "What happens to files I delete?",
        "answer": "Deleted files move to Trash and are kept there for 30 days before being permanently erased, per our Data Retention Policy.",
        "category": "Storage & Files",
        "policy": "Data Retention Policy",
    },
    {
        "question": "Can I recover a file after it's been permanently deleted?",
        "answer": "Unfortunately no. Once a file is permanently erased after the 30-day trash period, it cannot be recovered by you or by our support team.",
        "category": "Storage & Files",
        "related": ["What happens to files I delete?"],
    },
    {
        "question": "Is there a limit on individual file size?",
        "answer": "Free and Pro plans have a 10GB per-file limit. Business and Enterprise plans support files up to 100GB.",
        "category": "Storage & Files",
        "plan": "Free",
    },
    {
        "question": "What file types are supported?",
        "answer": "Nimbus stores any file type. Preview thumbnails and in-browser viewing are available for images, PDFs, videos, and common office document formats.",
        "category": "Storage & Files",
    },
    {
        "question": "Does Enterprise really offer unlimited storage?",
        "answer": "Yes, Enterprise storage has no fixed cap, but it's subject to our Fair Use Policy, which may flag unusually large accounts for review to prevent abuse.",
        "category": "Storage & Files",
        "plan": "Enterprise",
        "policy": "Fair Use Policy",
    },
    {
        "question": "How do I see how much storage I'm using?",
        "answer": "Your storage usage is shown at the bottom of the sidebar, and a full breakdown by file type is available under Settings > Storage.",
        "category": "Storage & Files",
    },
    {
        "question": "How do I share a file with someone who doesn't have a Nimbus account?",
        "answer": "Right-click any file, choose 'Get link', and set the permission to 'Anyone with the link'. The recipient can view or edit without signing up, depending on the permission you choose.",
        "category": "Sharing & Collaboration",
    },
    {
        "question": "Can I set an expiration date on a shared link?",
        "answer": "Yes, link expiration is available on Pro, Business, and Enterprise plans. Free plan links don't expire automatically.",
        "category": "Sharing & Collaboration",
        "plan": "Pro",
    },
    {
        "question": "How many people can I share a Business team folder with?",
        "answer": "Business team folders support unlimited internal collaborators and up to 500 external guest collaborators per folder.",
        "category": "Sharing & Collaboration",
        "plan": "Business",
    },
    {
        "question": "Can I password-protect a shared link?",
        "answer": "Yes, on Pro and above you can require a password before a link can be opened.",
        "category": "Sharing & Collaboration",
        "plan": "Pro",
    },
    {
        "question": "How do I see who has access to a file?",
        "answer": "Open the file, click 'Share', and the access panel lists every person and link with access, along with their permission level.",
        "category": "Sharing & Collaboration",
    },
    {
        "question": "What happens to shared links if I downgrade my plan?",
        "answer": "Links that use paid-only features like expiration dates or passwords stop enforcing those restrictions, but the link itself keeps working.",
        "category": "Sharing & Collaboration",
        "related": [
            "Can I set an expiration date on a shared link?",
            "Can I password-protect a shared link?",
        ],
    },
    {
        "question": "Which operating systems does the desktop app support?",
        "answer": "The Nimbus desktop app runs on Windows 10+, macOS 12+, and major Linux distributions via a .deb or .rpm package.",
        "category": "Apps & Devices",
    },
    {
        "question": "How many devices can I sync on the Free plan?",
        "answer": "The Free plan allows syncing on up to 2 devices. Pro and above allow unlimited devices.",
        "category": "Apps & Devices",
        "plan": "Free",
    },
    {
        "question": "Does the mobile app support offline access to files?",
        "answer": "Yes, you can mark any file or folder for offline access, and it will be downloaded for viewing without an internet connection.",
        "category": "Apps & Devices",
    },
    {
        "question": "Can I automatically back up my phone's camera roll?",
        "answer": "Yes, enable Camera Upload in the mobile app's settings to automatically back up new photos and videos as they're taken.",
        "category": "Apps & Devices",
    },
    {
        "question": "Is there a command-line tool for Nimbus?",
        "answer": "Yes, the Nimbus CLI is available for Business and Enterprise plans and supports scripted uploads, downloads, and sync status checks.",
        "category": "Apps & Devices",
        "plan": "Business",
    },
    {
        "question": "Why does the desktop app show a sync conflict?",
        "answer": "Sync conflicts happen when the same file is edited on two devices before they can sync. Nimbus keeps both versions and labels the newer one '(conflicted copy)'.",
        "category": "Apps & Devices",
    },
    {
        "question": "Why are my files not syncing?",
        "answer": "Check that the desktop app is running and you're signed in, that you have an active internet connection, and that you haven't exceeded your plan's storage limit.",
        "category": "Troubleshooting",
        "related": [
            "What happens if I exceed my storage limit on the Free plan?",
            "Why does the desktop app show a sync conflict?",
        ],
    },
    {
        "question": "Why can't I upload a file?",
        "answer": "Uploads fail if the file exceeds your plan's per-file size limit, if you're out of storage, or if the file name contains characters your operating system doesn't support.",
        "category": "Troubleshooting",
        "related": ["Is there a limit on individual file size?"],
    },
    {
        "question": "The mobile app keeps crashing, what should I do?",
        "answer": "Update to the latest app version, restart your device, and if the problem continues, clear the app's cache from your device's settings.",
        "category": "Troubleshooting",
    },
    {
        "question": "I didn't receive my password reset email, what should I do?",
        "answer": "Check your spam folder and confirm you're using the email address associated with your account. If it still doesn't arrive within 15 minutes, contact support.",
        "category": "Troubleshooting",
        "related": ["How do I reset my password?"],
    },
    {
        "question": "Why is my shared link showing 'Access Denied'?",
        "answer": "This usually means the link expired, the owner changed its permissions, or the file was moved to a folder you don't have access to.",
        "category": "Troubleshooting",
        "related": ["Can I set an expiration date on a shared link?"],
    },
    {
        "question": "How do I contact support?",
        "answer": "Free plan users can ask the community forum. Pro users get email support. Business and Enterprise customers can use live chat or their dedicated account manager.",
        "category": "Troubleshooting",
        "plan": "Free",
    },
]


def _build_faq_graph() -> SaveGraphRequest:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    edge_counter = 0

    def next_edge_id() -> str:
        nonlocal edge_counter
        edge_counter += 1
        return f"seed-f-e{edge_counter}"

    company_id = "seed-company"
    category_ids = {name: f"seed-faqcat-{_slug(name)}" for name in CATEGORIES_FAQ}
    plan_ids = {plan["name"]: f"seed-plan-{_slug(plan['name'])}" for plan in PLANS}
    policy_ids = {policy["name"]: f"seed-policy-{_slug(policy['name'])}" for policy in POLICIES}
    faq_ids = {faq["question"]: f"seed-faq-{_slug(faq['question'])}" for faq in FAQS}

    nodes.append(
        _node(
            company_id, COMPANY_NAME, "Company", 800, -260,
            description="A cloud storage and file-sharing platform for individuals and teams.",
        )
    )

    for i, name in enumerate(CATEGORIES_FAQ):
        node_id = category_ids[name]
        nodes.append(_node(node_id, name, "Category", i * 320, 0))
        edges.append(_rel(next_edge_id(), node_id, company_id, "part of"))

    for i, plan in enumerate(PLANS):
        node_id = plan_ids[plan["name"]]
        nodes.append(
            _node(
                node_id, plan["name"], "Plan", i * 320, 220,
                properties=[
                    NodeProperty(name="price", value=plan["price"]),
                    NodeProperty(name="storage", value=plan["storage"]),
                    NodeProperty(name="devices", value=plan["devices"]),
                    NodeProperty(name="support", value=plan["support"]),
                ],
            )
        )
        edges.append(_rel(next_edge_id(), node_id, company_id, "offered by"))

    for i, policy in enumerate(POLICIES):
        node_id = policy_ids[policy["name"]]
        nodes.append(_node(node_id, policy["name"], "Policy", i * 320, 440, description=policy["description"]))
        edges.append(_rel(next_edge_id(), node_id, company_id, "part of"))

    for i, faq in enumerate(FAQS):
        node_id = faq_ids[faq["question"]]
        nodes.append(_node(node_id, faq["question"], "FAQ", i * 260, 760, description=faq["answer"]))
        edges.append(_rel(next_edge_id(), node_id, category_ids[faq["category"]], "belongs to"))
        if "plan" in faq:
            edges.append(_rel(next_edge_id(), node_id, plan_ids[faq["plan"]], "applies to"))
        if "policy" in faq:
            edges.append(_rel(next_edge_id(), node_id, policy_ids[faq["policy"]], "references"))
        for related_question in faq.get("related", []):
            edges.append(_rel(next_edge_id(), node_id, faq_ids[related_question], "related to"))

    return SaveGraphRequest(name=f"{COMPANY_NAME} FAQs", nodes=nodes, edges=edges)


FAQ_GRAPH = _build_faq_graph()


# --- Software developer resume ---------------------------------------------
# One person, with education, work experience (each tied to a company and
# the skills used there), a flat skill list grouped into categories, plus
# certifications and side projects — so a query like "find an engineer with
# Python and AWS experience who built a RAG system" can match on the
# project/experience text and traverse to the skills and company behind it.

PERSON_NAME = "Alex Rivera"

EDUCATION = [
    {
        "name": "B.S. in Computer Science — University of Washington",
        "description": "Bachelor of Science in Computer Science, graduated with honors.",
        "years": "2014 - 2018",
        "gpa": "3.8",
        "honors": "Dean's List (6 semesters)",
    },
    {
        "name": "Full-Stack Web Development Bootcamp — App Academy",
        "description": "Intensive 16-week immersive program covering full-stack JavaScript and software engineering fundamentals.",
        "years": "2018",
    },
]

COMPANY_INFO = {
    "Skyline Analytics": "Real-time data analytics SaaS",
    "Bramble Technologies": "E-commerce platform",
    "Northwind Software": "Enterprise scheduling software",
    "Cascade Data Systems": "Data engineering consultancy",
}

EXPERIENCE = [
    {
        "title": "Senior Software Engineer",
        "company": "Skyline Analytics",
        "years": "2022 - Present",
        "location": "Seattle, WA (Remote)",
        "description": "Leads the backend platform team building scalable, multi-tenant APIs for a real-time analytics product; mentors three junior engineers and drives the team's migration to a graph-based data model.",
        "skills": ["Python", "FastAPI", "AWS", "Kubernetes", "Neo4j", "Technical Leadership", "Mentoring"],
    },
    {
        "title": "Software Engineer II",
        "company": "Bramble Technologies",
        "years": "2020 - 2022",
        "location": "Austin, TX",
        "description": "Built and operated microservices for an e-commerce checkout platform, and led the migration of a legacy monolith onto containers running on Kubernetes.",
        "skills": ["Node.js", "Docker", "Kubernetes", "AWS", "PostgreSQL", "Agile/Scrum"],
    },
    {
        "title": "Software Engineer",
        "company": "Northwind Software",
        "years": "2018 - 2020",
        "location": "Seattle, WA",
        "description": "Full-stack web developer on an enterprise scheduling product, building customer-facing features in React and backend services in Node.js.",
        "skills": ["React", "JavaScript", "Node.js", "PostgreSQL"],
    },
    {
        "title": "Junior Developer (Intern)",
        "company": "Cascade Data Systems",
        "years": "2017 - 2018",
        "location": "Seattle, WA",
        "description": "Built data ingestion pipelines in Python and wrote SQL transformations for a data engineering consultancy while finishing his degree.",
        "skills": ["Python", "SQL", "Machine Learning"],
    },
]

SKILL_CATEGORIES = {
    "Languages": ["Python", "JavaScript", "TypeScript", "SQL"],
    "Frontend": ["React", "Next.js", "Tailwind CSS"],
    "Backend": ["Node.js", "FastAPI", "Django", "GraphQL"],
    "Cloud & DevOps": ["AWS", "Docker", "Kubernetes", "Terraform"],
    "Databases": ["PostgreSQL", "Neo4j", "Redis"],
    "AI & Data": ["Machine Learning", "OpenAI API", "Vector Search"],
    "Soft Skills": ["Technical Leadership", "Mentoring", "Agile/Scrum"],
}

SKILL_LEVELS = {
    "Python": "Expert", "JavaScript": "Expert", "TypeScript": "Advanced", "SQL": "Advanced",
    "React": "Expert", "Next.js": "Advanced", "Tailwind CSS": "Intermediate",
    "Node.js": "Expert", "FastAPI": "Advanced", "Django": "Intermediate", "GraphQL": "Advanced",
    "AWS": "Advanced", "Docker": "Advanced", "Kubernetes": "Advanced", "Terraform": "Intermediate",
    "PostgreSQL": "Advanced", "Neo4j": "Intermediate", "Redis": "Intermediate",
    "Machine Learning": "Intermediate", "OpenAI API": "Advanced", "Vector Search": "Intermediate",
    "Technical Leadership": "Advanced", "Mentoring": "Advanced", "Agile/Scrum": "Advanced",
}

CERTIFICATIONS = [
    {"name": "AWS Certified Solutions Architect – Associate", "year": "2023", "issuer": "Amazon Web Services"},
    {"name": "Certified Kubernetes Administrator (CKA)", "year": "2022", "issuer": "Cloud Native Computing Foundation"},
    {"name": "Neo4j Certified Professional", "year": "2024", "issuer": "Neo4j, Inc."},
]

# PROJECTS[0] is a nod to this very app — a hybrid graph + vector RAG system.
PROJECTS = [
    {
        "name": "GraphRAG Chat System",
        "description": "An open-source retrieval-augmented chat system that combines live Neo4j graph traversal with vector search for hybrid question answering over a graph of entities and relationships.",
        "skills": ["Python", "FastAPI", "Neo4j", "React", "OpenAI API", "Vector Search"],
    },
    {
        "name": "Realtime Collaboration Board",
        "description": "A Trello-style kanban board supporting realtime multiplayer editing via WebSockets.",
        "skills": ["TypeScript", "React", "Node.js", "Redis"],
    },
    {
        "name": "Personal Finance Tracker API",
        "description": "A REST and GraphQL API for tracking personal expenses and budgets with automated transaction categorization.",
        "skills": ["Python", "Django", "GraphQL", "PostgreSQL"],
    },
]


def _build_resume_graph() -> SaveGraphRequest:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    edge_counter = 0

    def next_edge_id() -> str:
        nonlocal edge_counter
        edge_counter += 1
        return f"seed-r-e{edge_counter}"

    person_id = "seed-person"
    nodes.append(
        _node(
            person_id, PERSON_NAME, "Person", 900, -420,
            description="Senior software engineer with 6+ years building backend services, APIs, and full-stack web applications; focused on cloud infrastructure, graph databases, and applied AI.",
            properties=[
                NodeProperty(name="title", value="Senior Software Engineer"),
                NodeProperty(name="location", value="Seattle, WA"),
                NodeProperty(name="yearsOfExperience", value="6"),
            ],
        )
    )

    education_ids = {edu["name"]: f"seed-edu-{_slug(edu['name'])}" for edu in EDUCATION}
    for i, edu in enumerate(EDUCATION):
        node_id = education_ids[edu["name"]]
        properties = [NodeProperty(name="years", value=edu["years"])]
        if "gpa" in edu:
            properties.append(NodeProperty(name="gpa", value=edu["gpa"]))
        if "honors" in edu:
            properties.append(NodeProperty(name="honors", value=edu["honors"]))
        nodes.append(_node(node_id, edu["name"], "Education", i * 500, -160, description=edu["description"], properties=properties))
        edges.append(_rel(next_edge_id(), person_id, node_id, "studied at"))

    company_ids = {name: f"seed-company-{_slug(name)}" for name in COMPANY_INFO}
    for i, (name, industry) in enumerate(COMPANY_INFO.items()):
        nodes.append(
            _node(
                company_ids[name], name, "Company", i * 300, 400,
                properties=[NodeProperty(name="industry", value=industry)],
            )
        )

    category_ids = {name: f"seed-skillcat-{_slug(name)}" for name in SKILL_CATEGORIES}
    for i, name in enumerate(SKILL_CATEGORIES):
        nodes.append(_node(category_ids[name], name, "SkillCategory", i * 320, 1250))

    skill_ids: dict[str, str] = {}
    skill_index = 0
    for category, skills in SKILL_CATEGORIES.items():
        for skill in skills:
            node_id = f"seed-skill-{_slug(skill)}"
            skill_ids[skill] = node_id
            nodes.append(
                _node(
                    node_id, skill, "Skill", skill_index * 170, 1000,
                    properties=[NodeProperty(name="level", value=SKILL_LEVELS[skill])],
                )
            )
            edges.append(_rel(next_edge_id(), node_id, category_ids[category], "belongs to"))
            edges.append(_rel(next_edge_id(), person_id, node_id, "has skill"))
            skill_index += 1

    for i, exp in enumerate(EXPERIENCE):
        node_id = f"seed-exp-{_slug(exp['title'])}-{_slug(exp['company'])}"
        nodes.append(
            _node(
                node_id, exp["title"], "Experience", i * 350, 150,
                description=exp["description"],
                properties=[
                    NodeProperty(name="company", value=exp["company"]),
                    NodeProperty(name="years", value=exp["years"]),
                    NodeProperty(name="location", value=exp["location"]),
                ],
            )
        )
        edges.append(_rel(next_edge_id(), person_id, node_id, "worked at"))
        edges.append(_rel(next_edge_id(), node_id, company_ids[exp["company"]], "at company"))
        for skill in exp["skills"]:
            edges.append(_rel(next_edge_id(), node_id, skill_ids[skill], "used"))

    for i, cert in enumerate(CERTIFICATIONS):
        node_id = f"seed-cert-{_slug(cert['name'])}"
        nodes.append(
            _node(
                node_id, cert["name"], "Certification", 1300 + i * 340, -160,
                properties=[
                    NodeProperty(name="year", value=cert["year"]),
                    NodeProperty(name="issuer", value=cert["issuer"]),
                ],
            )
        )
        edges.append(_rel(next_edge_id(), person_id, node_id, "earned"))

    for i, project in enumerate(PROJECTS):
        node_id = f"seed-project-{_slug(project['name'])}"
        nodes.append(_node(node_id, project["name"], "Project", i * 380, 650, description=project["description"]))
        edges.append(_rel(next_edge_id(), person_id, node_id, "built"))
        for skill in project["skills"]:
            edges.append(_rel(next_edge_id(), node_id, skill_ids[skill], "uses"))

    return SaveGraphRequest(name=f"{PERSON_NAME} — Resume", nodes=nodes, edges=edges)


RESUME_GRAPH = _build_resume_graph()


# --- Library catalog ---------------------------------------------------------
# Books carry their own length/rating/availability as properties (so vector
# search can match on them directly) and link out to author, publisher,
# genre and — for the two trilogies — their series, so a query like "a
# fantasy novel under 450 pages that's available right now, by an
# award-winning author" can tell near-identical books apart.

AUTHORS = {
    "Helena Vargas": {"nationality": "Spanish", "birthYear": "1975", "awards": "Nebula Award for Best Novel (2019)"},
    "Marcus Chen": {"nationality": "American", "birthYear": "1968", "awards": "Edgar Award for Best Novel (2015)"},
    "Fiona McAllister": {"nationality": "Scottish", "birthYear": "1982", "awards": "British Fantasy Award (2021)"},
    "Diego Alvarez": {"nationality": "Mexican", "birthYear": "1959", "awards": "Pulitzer Prize for Biography (2010)"},
    "Priya Nair": {"nationality": "Indian", "birthYear": "1988", "awards": "Booker Prize shortlist (2022)"},
    "Thomas Whitfield": {"nationality": "British", "birthYear": "1945", "awards": "Order of the British Empire for Literature"},
    "Aiko Tanaka": {"nationality": "Japanese", "birthYear": "1979", "awards": "Hugo Award for Best Novel (2020)"},
    "Grace Okafor": {"nationality": "Nigerian", "birthYear": "1991", "awards": "none"},
    "Lucas Berg": {"nationality": "Swedish", "birthYear": "1970", "awards": "none"},
    "Nora Ellingsworth": {"nationality": "American", "birthYear": "1963", "awards": "National Book Award Finalist (2008)"},
}

PUBLISHERS = {
    "Lantern House Press": {"founded": "1952", "headquarters": "New York, NY"},
    "Harbor & Finch Publishing": {"founded": "1978", "headquarters": "London, UK"},
    "Cedarwood Books": {"founded": "1991", "headquarters": "Toronto, Canada"},
    "Midnight Oil Press": {"founded": "2003", "headquarters": "Seattle, WA"},
    "Granite Peak Publishing": {"founded": "1965", "headquarters": "Denver, CO"},
}

BOOK_GENRES = [
    "Mystery", "Science Fiction", "Fantasy", "Romance",
    "Historical Fiction", "Biography", "Thriller", "Non-Fiction",
]

BOOK_SERIES = {
    "The Obsidian Crown Trilogy": "Fantasy",
    "Inspector Reyes Mysteries": "Mystery",
}

# Deliberately includes books that look alike on genre/author alone so
# length and copies-available have to do real work in a search — e.g. two
# of the three Obsidian Crown books are currently checked out.
BOOKS = [
    {"title": "The Obsidian Crown", "author": "Fiona McAllister", "publisher": "Cedarwood Books", "genre": "Fantasy", "series": "The Obsidian Crown Trilogy", "pages": 412, "year": 2018, "rating": 4.6, "copies": 3, "description": "A disgraced knight discovers a crown that can command the dead, and must decide whether to use it to save her kingdom or destroy it."},
    {"title": "The Shattered Throne", "author": "Fiona McAllister", "publisher": "Cedarwood Books", "genre": "Fantasy", "series": "The Obsidian Crown Trilogy", "pages": 448, "year": 2019, "rating": 4.7, "copies": 0, "description": "With the crown's power awakened, old alliances crumble as three claimants march on the capital."},
    {"title": "The Last Ember King", "author": "Fiona McAllister", "publisher": "Cedarwood Books", "genre": "Fantasy", "series": "The Obsidian Crown Trilogy", "pages": 501, "year": 2021, "rating": 4.8, "copies": 2, "description": "The final battle for the Obsidian Crown forces its bearer to choose between the throne and the people she swore to protect."},
    {"title": "Silence in Seville", "author": "Marcus Chen", "publisher": "Lantern House Press", "genre": "Mystery", "series": "Inspector Reyes Mysteries", "pages": 298, "year": 2015, "rating": 4.3, "copies": 1, "description": "Inspector Reyes investigates the disappearance of a flamenco dancer on the eve of her final performance."},
    {"title": "The Alhambra Cipher", "author": "Marcus Chen", "publisher": "Lantern House Press", "genre": "Mystery", "series": "Inspector Reyes Mysteries", "pages": 312, "year": 2017, "rating": 4.4, "copies": 0, "description": "A centuries-old cipher hidden in the Alhambra's tiles leads Inspector Reyes into a conspiracy reaching the highest levels of the city government."},
    {"title": "Echoes of Granada", "author": "Marcus Chen", "publisher": "Lantern House Press", "genre": "Mystery", "series": "Inspector Reyes Mysteries", "pages": 334, "year": 2020, "rating": 4.5, "copies": 4, "description": "Inspector Reyes returns to his hometown to solve a murder that mirrors a cold case from his own childhood."},
    {"title": "Nebula's Edge", "author": "Aiko Tanaka", "publisher": "Midnight Oil Press", "genre": "Science Fiction", "pages": 389, "year": 2020, "rating": 4.9, "copies": 2, "description": "A deep-space salvage crew discovers a derelict ship carrying a passenger who shouldn't be able to exist."},
    {"title": "The Quantum Gardener", "author": "Aiko Tanaka", "publisher": "Midnight Oil Press", "genre": "Science Fiction", "pages": 356, "year": 2022, "rating": 4.6, "copies": 1, "description": "A botanist on a generation ship learns that the plants she's cultivating are quietly rewriting the ship's quantum computer."},
    {"title": "Colony Zero", "author": "Lucas Berg", "publisher": "Granite Peak Publishing", "genre": "Science Fiction", "pages": 410, "year": 2016, "rating": 4.1, "copies": 0, "description": "The first colonists on a new world realize the planet was already inhabited, by something that doesn't want them there."},
    {"title": "The Garden of Quiet Hours", "author": "Priya Nair", "publisher": "Harbor & Finch Publishing", "genre": "Romance", "pages": 276, "year": 2022, "rating": 4.4, "copies": 5, "description": "Two rival landscape architects are forced to co-design a memorial garden, and slowly fall for each other along the way."},
    {"title": "Letters from Monsoon Street", "author": "Priya Nair", "publisher": "Harbor & Finch Publishing", "genre": "Romance", "pages": 302, "year": 2019, "rating": 4.2, "copies": 2, "description": "A box of unsent love letters found in an old Mumbai apartment changes the lives of the two strangers who find them."},
    {"title": "Across the Salt Flats", "author": "Nora Ellingsworth", "publisher": "Lantern House Press", "genre": "Historical Fiction", "pages": 420, "year": 2008, "rating": 4.5, "copies": 1, "description": "A family flees the Dust Bowl across the salt flats of Utah, carrying a secret that could tear them apart before they reach California."},
    {"title": "The Weight of Ashes", "author": "Nora Ellingsworth", "publisher": "Lantern House Press", "genre": "Historical Fiction", "pages": 388, "year": 2012, "rating": 4.3, "copies": 0, "description": "In the aftermath of a city-wide fire, a young firefighter and a newspaper reporter piece together who set the blaze, and why."},
    {"title": "The Cartographer's Daughter", "author": "Diego Alvarez", "publisher": "Granite Peak Publishing", "genre": "Biography", "pages": 512, "year": 2010, "rating": 4.7, "copies": 2, "description": "The life of a 19th-century mapmaker's daughter who secretly corrected her father's charts and quietly reshaped the era's maps of the Americas."},
    {"title": "Voices of the Resistance", "author": "Diego Alvarez", "publisher": "Granite Peak Publishing", "genre": "Biography", "pages": 468, "year": 2014, "rating": 4.6, "copies": 1, "description": "Oral histories of five ordinary citizens who sheltered refugees during a decade of civil conflict, told largely in their own words."},
    {"title": "The Insomniac's Guide to the Universe", "author": "Thomas Whitfield", "publisher": "Harbor & Finch Publishing", "genre": "Non-Fiction", "pages": 240, "year": 2017, "rating": 4.0, "copies": 3, "description": "A popular-science tour of cosmology written for readers who do their best thinking at 3 a.m."},
    {"title": "Why We Remember", "author": "Thomas Whitfield", "publisher": "Harbor & Finch Publishing", "genre": "Non-Fiction", "pages": 288, "year": 2021, "rating": 4.3, "copies": 2, "description": "A neuroscientist explains how memory actually works, and why we so often trust the wrong ones."},
    {"title": "The Thirteenth Hour", "author": "Grace Okafor", "publisher": "Midnight Oil Press", "genre": "Thriller", "pages": 334, "year": 2023, "rating": 4.5, "copies": 0, "description": "A night-shift ER nurse realizes the same patient has died in her ER thirteen times, in thirteen different ways, on thirteen different nights."},
    {"title": "No One Followed Her Home", "author": "Grace Okafor", "publisher": "Midnight Oil Press", "genre": "Thriller", "pages": 356, "year": 2021, "rating": 4.4, "copies": 1, "description": "A woman convinced she's being followed starts leaving a trail of clues for a detective, only for the detective to realize the trail predates her complaint."},
    {"title": "The Honey and the Knife", "author": "Helena Vargas", "publisher": "Cedarwood Books", "genre": "Fantasy", "pages": 398, "year": 2019, "rating": 4.6, "copies": 3, "description": "A beekeeper who can taste lies in honey is recruited by a dying queen to find out who's been poisoning the royal hives, and the court along with them."},
]


def _build_book_graph() -> SaveGraphRequest:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    edge_counter = 0

    def next_edge_id() -> str:
        nonlocal edge_counter
        edge_counter += 1
        return f"seed-b-e{edge_counter}"

    author_ids = {name: f"seed-author-{_slug(name)}" for name in AUTHORS}
    publisher_ids = {name: f"seed-publisher-{_slug(name)}" for name in PUBLISHERS}
    genre_ids = {name: f"seed-bgenre-{_slug(name)}" for name in BOOK_GENRES}
    series_ids = {name: f"seed-series-{_slug(name)}" for name in BOOK_SERIES}

    for i, (name, info) in enumerate(AUTHORS.items()):
        nodes.append(
            _node(
                author_ids[name], name, "Author", i * 260, 0,
                properties=[
                    NodeProperty(name="nationality", value=info["nationality"]),
                    NodeProperty(name="birthYear", value=info["birthYear"]),
                    NodeProperty(name="awards", value=info["awards"]),
                ],
            )
        )

    for i, (name, info) in enumerate(PUBLISHERS.items()):
        nodes.append(
            _node(
                publisher_ids[name], name, "Publisher", i * 300, 240,
                properties=[
                    NodeProperty(name="founded", value=info["founded"]),
                    NodeProperty(name="headquarters", value=info["headquarters"]),
                ],
            )
        )

    for i, name in enumerate(BOOK_GENRES):
        nodes.append(_node(genre_ids[name], name, "Genre", i * 260, 1180))

    for i, (name, genre) in enumerate(BOOK_SERIES.items()):
        nodes.append(_node(series_ids[name], name, "Series", i * 400, 460))
        edges.append(_rel(next_edge_id(), series_ids[name], genre_ids[genre], "belongs to"))

    for i, book in enumerate(BOOKS):
        node_id = f"seed-book-{_slug(book['title'])}"
        nodes.append(
            _node(
                node_id, book["title"], "Book", i * 230, 760,
                description=book["description"],
                properties=[
                    NodeProperty(name="pages", value=str(book["pages"])),
                    NodeProperty(name="year", value=str(book["year"])),
                    NodeProperty(name="rating", value=str(book["rating"])),
                    NodeProperty(name="copiesAvailable", value=str(book["copies"])),
                    NodeProperty(name="available", value="true" if book["copies"] > 0 else "false"),
                ],
            )
        )
        edges.append(_rel(next_edge_id(), node_id, author_ids[book["author"]], "written by"))
        edges.append(_rel(next_edge_id(), node_id, publisher_ids[book["publisher"]], "published by"))
        edges.append(_rel(next_edge_id(), node_id, genre_ids[book["genre"]], "belongs to genre"))
        if "series" in book:
            edges.append(_rel(next_edge_id(), node_id, series_ids[book["series"]], "part of series"))

    return SaveGraphRequest(name="City Library Catalog", nodes=nodes, edges=edges)


BOOK_GRAPH = _build_book_graph()


# --- Movie recommendation catalog --------------------------------------------
# Each movie carries its own runtime/scores/mood tag as properties (so a
# vector match can filter on tone and length directly) and links out to
# director, studio, streaming platform and cast, so "a mind-bending sci-fi
# movie under two hours on StreamVault" can tell near-identical movies apart.

MOVIE_GENRES = ["Action", "Comedy", "Drama", "Science Fiction", "Horror", "Romance", "Animation", "Documentary"]

DIRECTORS = {
    "Renata Souza": "Best Director, Silver Lotus Festival (2021)",
    "Jonah Pierce": "Academy Award nomination, Best Director (2019)",
    "Mei Lin Zhao": "Golden Bear, Berlin Film Festival (2020)",
    "Caleb Thorn": "none",
    "Amara Osei": "BAFTA for Best Director (2022)",
    "Viktor Kessler": "none",
    "Sofia Bianchi": "Palme d'Or nomination (2018)",
    "Dante Okoro": "none",
}

ACTORS = [
    "Elena Marsh", "Theo Navarro", "Isabelle Kwan", "Marcus Dubois", "Nia Abara",
    "Lukas Halvorsen", "Rosa Delgado", "Owen Fairchild", "Yuki Takahashi", "Grace Linden",
]

STUDIOS = {
    "Pinnacle Pictures": "Los Angeles, CA",
    "Lumen Studios": "Vancouver, Canada",
    "Northstar Films": "Atlanta, GA",
    "Driftwood Entertainment": "Austin, TX",
}

PLATFORMS = ["StreamVault", "CinePlus", "HomeReel"]

# Two pairs of near-identical movies (same genre/mood) differ only on
# runtime or platform, so "under two hours" and "on StreamVault" actually
# have to narrow the result down.
MOVIES = [
    {"title": "Echo Chamber", "genre": "Science Fiction", "director": "Renata Souza", "studio": "Pinnacle Pictures", "actors": ["Elena Marsh", "Theo Navarro"], "platform": "StreamVault", "year": 2021, "runtime": 118, "critic": 88, "audience": 82, "mpaa": "PG-13", "mood": "mind-bending", "description": "A sound engineer discovers her recording studio is picking up broadcasts from a parallel version of her own life."},
    {"title": "Last Light on Mercury", "genre": "Science Fiction", "director": "Jonah Pierce", "studio": "Lumen Studios", "actors": ["Isabelle Kwan", "Marcus Dubois"], "platform": "CinePlus", "year": 2019, "runtime": 142, "critic": 79, "audience": 85, "mpaa": "PG-13", "mood": "epic", "description": "The final survivors of a failed Mercury colony race the sunrise terminator line to reach the one remaining shuttle."},
    {"title": "Static", "genre": "Science Fiction", "director": "Caleb Thorn", "studio": "Driftwood Entertainment", "actors": ["Nia Abara", "Lukas Halvorsen"], "platform": "StreamVault", "year": 2023, "runtime": 101, "critic": 71, "audience": 68, "mpaa": "R", "mood": "mind-bending", "description": "A hacker who can briefly see one minute into the future uses the trick to survive a night she's lived through a dozen times."},
    {"title": "The Wedding Disaster", "genre": "Comedy", "director": "Amara Osei", "studio": "Pinnacle Pictures", "actors": ["Rosa Delgado", "Owen Fairchild"], "platform": "HomeReel", "year": 2022, "runtime": 104, "critic": 65, "audience": 90, "mpaa": "PG-13", "mood": "feel-good", "description": "Two feuding wedding planners are forced to co-run the same disastrous celebrity wedding."},
    {"title": "Office Hours", "genre": "Comedy", "director": "Viktor Kessler", "studio": "Northstar Films", "actors": ["Yuki Takahashi", "Grace Linden"], "platform": "HomeReel", "year": 2020, "runtime": 95, "critic": 60, "audience": 78, "mpaa": "PG-13", "mood": "feel-good", "description": "A burnt-out professor and an overly ambitious teaching assistant swap bodies the week before finals."},
    {"title": "Carnival of Fools", "genre": "Comedy", "director": "Sofia Bianchi", "studio": "Lumen Studios", "actors": ["Theo Navarro", "Rosa Delgado"], "platform": "CinePlus", "year": 2018, "runtime": 99, "critic": 72, "audience": 81, "mpaa": "PG-13", "mood": "feel-good", "description": "A traveling carnival's con artists accidentally book themselves into a town's biggest charity gala."},
    {"title": "Where the Willows Weep", "genre": "Drama", "director": "Mei Lin Zhao", "studio": "Northstar Films", "actors": ["Elena Marsh", "Nia Abara"], "platform": "CinePlus", "year": 2017, "runtime": 128, "critic": 91, "audience": 86, "mpaa": "PG-13", "mood": "tearjerker", "description": "Three sisters return to their childhood home to scatter their mother's ashes and confront the secret that split the family apart."},
    {"title": "Harvest Moon", "genre": "Drama", "director": "Dante Okoro", "studio": "Driftwood Entertainment", "actors": ["Lukas Halvorsen", "Grace Linden"], "platform": "StreamVault", "year": 2020, "runtime": 112, "critic": 84, "audience": 79, "mpaa": "R", "mood": "tearjerker", "description": "A farmer facing foreclosure takes in a runaway teenager, and the two slowly rebuild what they've both lost."},
    {"title": "The Understudy", "genre": "Drama", "director": "Renata Souza", "studio": "Pinnacle Pictures", "actors": ["Isabelle Kwan", "Owen Fairchild"], "platform": "CinePlus", "year": 2022, "runtime": 121, "critic": 87, "audience": 74, "mpaa": "R", "mood": "slow-burn", "description": "A Broadway understudy gets her one shot at the lead role the same week her mentor is diagnosed with a terminal illness."},
    {"title": "Nightshade Manor", "genre": "Horror", "director": "Caleb Thorn", "studio": "Driftwood Entertainment", "actors": ["Marcus Dubois", "Yuki Takahashi"], "platform": "StreamVault", "year": 2021, "runtime": 97, "critic": 68, "audience": 73, "mpaa": "R", "mood": "edge-of-your-seat", "description": "A family inherits a Victorian manor where every room rearranges itself at midnight."},
    {"title": "The Quiet Ones", "genre": "Horror", "director": "Viktor Kessler", "studio": "Lumen Studios", "actors": ["Grace Linden", "Theo Navarro"], "platform": "HomeReel", "year": 2019, "runtime": 89, "critic": 74, "audience": 70, "mpaa": "R", "mood": "edge-of-your-seat", "description": "A support group for insomniacs starts to suspect their shared dreams are being watched by something in the hospital's old wing."},
    {"title": "Hollow Tide", "genre": "Horror", "director": "Sofia Bianchi", "studio": "Northstar Films", "actors": ["Rosa Delgado", "Lukas Halvorsen"], "platform": "StreamVault", "year": 2023, "runtime": 105, "critic": 63, "audience": 66, "mpaa": "R", "mood": "edge-of-your-seat", "description": "A marine biologist studying a red tide bloom realizes the algae is responding to the fishing village's grief."},
    {"title": "Letters to No One", "genre": "Romance", "director": "Amara Osei", "studio": "Pinnacle Pictures", "actors": ["Nia Abara", "Owen Fairchild"], "platform": "HomeReel", "year": 2021, "runtime": 108, "critic": 77, "audience": 88, "mpaa": "PG-13", "mood": "feel-good", "description": "A mail carrier starts answering a decade of unsent love letters addressed to a house that's been empty for years."},
    {"title": "Second Chances at the Lighthouse", "genre": "Romance", "director": "Jonah Pierce", "studio": "Lumen Studios", "actors": ["Isabelle Kwan", "Marcus Dubois"], "platform": "CinePlus", "year": 2018, "runtime": 102, "critic": 70, "audience": 84, "mpaa": "PG", "mood": "feel-good", "description": "Two childhood sweethearts reunite when they're both hired to restore the same decommissioned lighthouse."},
    {"title": "The Long Way Home", "genre": "Animation", "director": "Mei Lin Zhao", "studio": "Northstar Films", "actors": ["Yuki Takahashi", "Grace Linden"], "platform": "StreamVault", "year": 2022, "runtime": 94, "critic": 92, "audience": 95, "mpaa": "PG", "mood": "feel-good", "description": "A lost delivery robot crosses an entire continent to return a child's drawing, making unlikely friends along the way."},
    {"title": "Starlit Circus", "genre": "Animation", "director": "Dante Okoro", "studio": "Driftwood Entertainment", "actors": ["Elena Marsh", "Theo Navarro"], "platform": "HomeReel", "year": 2020, "runtime": 88, "critic": 85, "audience": 90, "mpaa": "PG", "mood": "feel-good", "description": "A traveling circus of sentient constellations tries to earn back the night sky's trust after accidentally causing an eclipse."},
    {"title": "Deep Current", "genre": "Documentary", "director": "Renata Souza", "studio": "Pinnacle Pictures", "actors": [], "platform": "CinePlus", "year": 2019, "runtime": 84, "critic": 90, "audience": 77, "mpaa": "PG", "mood": "thought-provoking", "description": "A year embedded with a deep-sea research vessel mapping hydrothermal vents no human has ever seen."},
    {"title": "The Price of Silence", "genre": "Documentary", "director": "Caleb Thorn", "studio": "Lumen Studios", "actors": [], "platform": "StreamVault", "year": 2021, "runtime": 96, "critic": 86, "audience": 72, "mpaa": "PG-13", "mood": "thought-provoking", "description": "Investigative journalists trace how a single factory's cost-cutting decision rippled into a decade of unexplained illnesses downstream."},
    {"title": "Edge of Tomorrow Street", "genre": "Action", "director": "Jonah Pierce", "studio": "Northstar Films", "actors": ["Marcus Dubois", "Nia Abara"], "platform": "StreamVault", "year": 2023, "runtime": 124, "critic": 75, "audience": 83, "mpaa": "PG-13", "mood": "edge-of-your-seat", "description": "A retired stunt driver is pulled back in for one last job: smuggling a data drive across a city on lockdown in under an hour."},
    {"title": "Iron Tide", "genre": "Action", "director": "Sofia Bianchi", "studio": "Driftwood Entertainment", "actors": ["Lukas Halvorsen", "Rosa Delgado"], "platform": "CinePlus", "year": 2017, "runtime": 131, "critic": 69, "audience": 80, "mpaa": "PG-13", "mood": "edge-of-your-seat", "description": "A salvage crew racing a rival corporation to reach a sunken warship's reactor core before it destabilizes the harbor."},
]


def _build_movie_graph() -> SaveGraphRequest:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    edge_counter = 0

    def next_edge_id() -> str:
        nonlocal edge_counter
        edge_counter += 1
        return f"seed-m-e{edge_counter}"

    genre_ids = {name: f"seed-mgenre-{_slug(name)}" for name in MOVIE_GENRES}
    director_ids = {name: f"seed-director-{_slug(name)}" for name in DIRECTORS}
    actor_ids = {name: f"seed-actor-{_slug(name)}" for name in ACTORS}
    studio_ids = {name: f"seed-studio-{_slug(name)}" for name in STUDIOS}
    platform_ids = {name: f"seed-platform-{_slug(name)}" for name in PLATFORMS}

    for i, name in enumerate(MOVIE_GENRES):
        nodes.append(_node(genre_ids[name], name, "Genre", i * 260, 0))

    for i, (name, awards) in enumerate(DIRECTORS.items()):
        nodes.append(
            _node(
                director_ids[name], name, "Director", i * 260, 240,
                properties=[NodeProperty(name="awards", value=awards)],
            )
        )

    for i, name in enumerate(ACTORS):
        nodes.append(_node(actor_ids[name], name, "Actor", i * 230, 1300))

    for i, (name, hq) in enumerate(STUDIOS.items()):
        nodes.append(
            _node(
                studio_ids[name], name, "Studio", i * 300, 480,
                properties=[NodeProperty(name="headquarters", value=hq)],
            )
        )

    for i, name in enumerate(PLATFORMS):
        nodes.append(_node(platform_ids[name], name, "Platform", i * 300, 1540))

    for i, movie in enumerate(MOVIES):
        node_id = f"seed-movie-{_slug(movie['title'])}"
        nodes.append(
            _node(
                node_id, movie["title"], "Movie", i * 230, 860,
                description=movie["description"],
                properties=[
                    NodeProperty(name="year", value=str(movie["year"])),
                    NodeProperty(name="runtime", value=f"{movie['runtime']} min"),
                    NodeProperty(name="criticScore", value=str(movie["critic"])),
                    NodeProperty(name="audienceScore", value=str(movie["audience"])),
                    NodeProperty(name="mpaaRating", value=movie["mpaa"]),
                    NodeProperty(name="mood", value=movie["mood"]),
                ],
            )
        )
        edges.append(_rel(next_edge_id(), node_id, genre_ids[movie["genre"]], "belongs to genre"))
        edges.append(_rel(next_edge_id(), node_id, director_ids[movie["director"]], "directed by"))
        edges.append(_rel(next_edge_id(), node_id, studio_ids[movie["studio"]], "produced by"))
        edges.append(_rel(next_edge_id(), node_id, platform_ids[movie["platform"]], "available on"))
        for actor in movie["actors"]:
            edges.append(_rel(next_edge_id(), node_id, actor_ids[actor], "stars"))

    return SaveGraphRequest(name="Movie Recommendation Catalog", nodes=nodes, edges=edges)


MOVIE_GRAPH = _build_movie_graph()

SEED_GRAPHS = [FAMILY_GRAPH, GROCERY_GRAPH, FAQ_GRAPH, RESUME_GRAPH, BOOK_GRAPH, MOVIE_GRAPH]
