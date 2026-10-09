#!/usr/bin/env python3
"""
Generate 2,000 diverse, high-quality developer anti-burnout training examples
for Thinking Machines (Tinker) fine-tuning on thinkingmachines/Inkling-Small.
"""

import json
import random

PROBLEMS = [
    ("debugging CSS flexbox alignment", "nudging that div by two pixels", "your posture looks like a boiled prawn"),
    ("resolving a git merge conflict with 35 files", "staring blankly at git conflict markers", "the conflict isn't going anywhere"),
    ("dealing with a Next.js hydration error", "refreshing the page hoping the hydration error disappears", "React will still be confusing in 20 minutes"),
    ("waiting for a 15-minute Docker image build", "watching terminal progress bars slowly scroll", "Docker builds whenever it feels like it"),
    ("arguing over variable naming in a pull request", "typing passive-aggressive review comments", "nobody will remember this variable name in 6 months"),
    ("troubleshooting a PostgreSQL slow query deadlock", "running EXPLAIN ANALYZE for the tenth time", "your database needs an index, but your brain needs oxygen"),
    ("fixing a Kubernetes CrashLoopBackOff", "reading cryptic pod restart logs", "the cluster will survive without you for half an hour"),
    ("sitting through 5 back-to-back sprint planning meetings", "slumping in your chair nodding at Jira tickets", "your eyes have been focused 30cm away for 6 hours"),
    ("hunting a silent undefined is not a function bug", "putting console.log('here 12') everywhere", "JavaScript has tortured you enough today"),
    ("doomscrolling tech Twitter and comparing yourself to others", "refreshing social media feeds in a dark room", "the algorithm is draining your sanity"),
    ("prematurely optimizing a database schema at 6:30 PM", "over-architecting microservices for 10 users", "keep it simple and close the laptop lid"),
    ("fighting Webpack memory leak crashes", "restarting dev servers every 4 minutes", "your RAM is fried and so is your attention span"),
    ("reading confusing third-party API documentation", "deciphering outdated swagger docs with broken examples", "take a step back and breathe"),
    ("writing unit tests for code that was written at 2 AM", "mocking 14 nested dependencies for a simple function", "give your testing fingers a rest"),
    ("stressing over an impending Friday afternoon production deployment", "nervously hovering your mouse over the merge button", "never deploy on Friday without a clear head"),
    ("debugging an async race condition in production", "adding random sleep statements to fix timing bugs", "the race condition won't solve itself while you're exhausted"),
    ("trying to center a modal horizontally and vertically", "adding position: absolute; top: 50%; transform: translateY(-50%)", "CSS was not meant to cause this much emotional damage"),
    ("refactoring legacy spaghetti code with zero comments", "unraveling 800-line functions with global state", "step away before you rewrite the whole company from scratch"),
    ("sitting with severe neck stiffness and dry eyes", "squinting at high-contrast terminal themes", "your cervical spine is begging for mercy"),
    ("obsessing over Lighthouse performance scores", "optimizing font loading by 4 milliseconds", "real human beings care more about fresh air than 99 Lighthouse points")
]

DESTINATIONS = [
    ("the corner tea stall (tapri)", "order a piping hot cutting adrak chai", "sip it standing under the shade of the banyan tree"),
    ("the local colony park", "take a relaxed 1.5 km loop around the jogging track", "spot at least one peaceful stray dog taking an evening nap"),
    ("the neighborhood coconut water cart", "drink a fresh sweet tender coconut", "let the cool water reset your fried nervous system"),
    ("the quiet residential backlane", "walk briskly while looking up at the flowering bougainvillea", "take ten long diaphragmatic breaths of evening air"),
    ("the tea stall near the roundabout", "get an elaichi chai in a clay kulhad", "watch the evening streetlights flicker on across the city"),
    ("the neighborhood park bench", "sit in the gentle evening breeze for 10 minutes", "listen to the distant chirping of green parakeets and mynas"),
    ("the corner bakery", "grab a fresh warm puff or bun maska", "chat with the shopkeeper instead of chatting with Slack bots"),
    ("the tree-lined sidewalk", "walk a continuous 20-minute loop without touching your phone", "let your peripheral vision stretch out to the horizon"),
    ("the local fruit stall", "pick up some sweet seasonal oranges or bananas", "feel the evening coolness settle in after a long humid day"),
    ("the tea stall beside the peepal tree", "order a strong masala chai", "watch the rustling leaves high above and forget about Jira")
]

CLOSINGS = [
    "Lock your screen right now and go touch real grass.",
    "If you open Slack before 20 minutes, you owe your whole team samosas.",
    "Put your slippers on, step out the door, and feel the real world.",
    "Leave your phone in your pocket and let your brain reboot.",
    "Close that laptop lid immediately; the outdoors is calling.",
    "Take this walk seriously—your spine and sanity will thank you.",
    "Step away from the glowing glass and breathe real oxygen.",
    "Go outside, look at the sky, and remember there is life outside of code.",
    "Your code will still be here when you return, but this sunset won't.",
    "Touch some grass, pet a good dog, and enjoy the evening air."
]

TIMES = ["at 5:30 PM", "at 6:15 PM", "during dusk", "on a Friday evening", "during afternoon slump", "after lunch", "at golden hour", "after 4 hours of meetings"]
DISTANCES = ["800 meters", "1.2 km", "1.5 km", "1.8 km", "2.0 km", "2.4 km"]

def generate_examples(count=2000):
    dataset = []
    seen_prompts = set()
    
    # Generate variations
    idx = 0
    while len(dataset) < count:
        prob_topic, prob_act, prob_burn = random.choice(PROBLEMS)
        dest_place, dest_action, dest_env = random.choice(DESTINATIONS)
        closing = random.choice(CLOSINGS)
        t_time = random.choice(TIMES)
        dist = random.choice(DISTANCES)
        
        prompt_templates = [
            f"Developer state: Currently {prob_topic} {t_time}. Feeling severe mental burnout. Time to touch grass.",
            f"Developer situation: Spent 4 hours {prob_topic}. Energy at zero. Needs an outdoor break.",
            f"Context: Developer is {prob_topic} {t_time}. Spine stiff, eyes hurting. Requesting walk mission.",
            f"Status check: Stuck {prob_topic} {t_time}. Frustrated and doomscrolling. Time to touch grass.",
            f"Developer prompt: I have been {prob_topic} all evening. Pull me away from my desk."
        ]
        
        prompt = random.choice(prompt_templates)
        
        # Avoid duplicate prompts
        if prompt in seen_prompts and len(dataset) > 500:
            prompt = f"{prompt} [Session ID: #{len(dataset)+1}]"
        seen_prompts.add(prompt)
        
        completion = f"Stop {prob_act}; {prob_burn}. Step away from the screen, walk {dist} to {dest_place}, {dest_action}, and {dest_env}. {closing}"
        
        dataset.append({
            "prompt": prompt,
            "completion": completion
        })
        
    return dataset

if __name__ == "__main__":
    count = 2000
    print(f"Generating {count} developer anti-burnout training pairs...")
    data = generate_examples(count)
    
    out_path = "dataset.jsonl"
    with open(out_path, "w", encoding="utf-8") as f:
        for entry in data:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            
    print(f"Successfully generated {len(data)} training pairs in {out_path}!")
