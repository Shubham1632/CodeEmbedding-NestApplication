export const functionData = [
  {
    name: 'GlowAdvancement.addCriterion',
    body: 'public void addCriterion(String criterion) {\n        if (!criteriaIds.contains(criterion)) {\n            criteriaIds.add(criterion);\n        }\n    }',
  },
  {
    name: 'GlowAdvancement.addRequirement',
    body: 'public void addRequirement(List<String> criteria) {\n        requirements.add(criteria);\n    }',
  },
  {
    name: 'GlowAdvancement.getCriteria',
    body: '@Override\n    public List<String> getCriteria() {\n        return ImmutableList.copyOf(criteriaIds);\n    }',
  },
];
