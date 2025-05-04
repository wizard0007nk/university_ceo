import React, { useState } from 'react';
import Papa from 'papaparse';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Department {
  Department: string;
  Students: number;
  Faculty: number;
  Budget: number;
  'Student-Faculty Ratio'?: number;
  'Budget per Student'?: number;
}

function App() {
  const [data, setData] = useState<Department[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const analyzeDepartmentData = (departments: Department[]) => {
    return departments.map(dept => ({
      ...dept,
      'Student-Faculty Ratio': dept.Students / dept.Faculty,
      'Budget per Student': dept.Budget / dept.Students
    }));
  };

  const generateRecommendations = (departments: Department[]) => {
    const recommendations: string[] = [];
    departments.forEach(dept => {
      if (dept['Student-Faculty Ratio']! > 30) {
        recommendations.push(`🚨 High student-faculty ratio in ${dept.Department} (${dept['Student-Faculty Ratio']!.toFixed(1)}:1). Consider hiring more faculty.`);
      }
      const avgBudgetPerStudent = departments.reduce((acc, d) => acc + d.Budget / d.Students, 0) / departments.length;
      if (dept['Budget per Student']! < avgBudgetPerStudent * 0.8) {
        recommendations.push(`💰 Low budget per student in ${dept.Department} ($${dept['Budget per Student']!.toFixed(2)}). Consider budget increase.`);
      }
    });
    return recommendations;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          const analyzedData = analyzeDepartmentData(results.data as Department[]);
          setData(analyzedData);
        }
      });
    }
  };

  const getAiInsights = async () => {
    setLoading(true);
    try {
      const totalStudents = data.reduce((acc, dept) => acc + dept.Students, 0);
      const avgRatio = data.reduce((acc, dept) => acc + (dept['Student-Faculty Ratio'] || 0), 0) / data.length;
      const totalBudget = data.reduce((acc, dept) => acc + dept.Budget, 0);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: `Analyze this university data and provide strategic insights:
              - Total students: ${totalStudents}
              - Average student-faculty ratio: ${avgRatio.toFixed(1)}
              - Total budget: $${totalBudget.toFixed(2)}
              What are the key challenges and opportunities?`
          }]
        })
      });

      const result = await response.json();
      setAiInsight(result.choices[0].message.content);
    } catch (error) {
      setAiInsight('Error getting AI insights. Please try again later.');
    }
    setLoading(false);
  };

  const loadSampleData = () => {
    const sampleData: Department[] = [
      { Department: 'Computer Science', Students: 450, Faculty: 12, Budget: 2000000 },
      { Department: 'Mathematics', Students: 300, Faculty: 10, Budget: 1500000 },
      { Department: 'Physics', Students: 200, Faculty: 8, Budget: 1800000 },
      { Department: 'Chemistry', Students: 250, Faculty: 9, Budget: 1700000 },
      { Department: 'Biology', Students: 350, Faculty: 11, Budget: 1900000 },
      { Department: 'Engineering', Students: 500, Faculty: 15, Budget: 2500000 },
      { Department: 'Psychology', Students: 400, Faculty: 10, Budget: 1600000 },
      { Department: 'Economics', Students: 350, Faculty: 9, Budget: 1400000 }
    ];
    setData(analyzeDepartmentData(sampleData));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">🎓 University Decision Support System</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="mb-4"
          />
          <button
            onClick={loadSampleData}
            className="ml-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Use Sample Data
          </button>
        </div>

        {data.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">Total Students</h3>
                <p className="text-3xl font-bold">
                  {data.reduce((acc, dept) => acc + dept.Students, 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">Total Faculty</h3>
                <p className="text-3xl font-bold">
                  {data.reduce((acc, dept) => acc + dept.Faculty, 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">Total Budget</h3>
                <p className="text-3xl font-bold">
                  ${data.reduce((acc, dept) => acc + dept.Budget, 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <Bar
                  data={{
                    labels: data.map(dept => dept.Department),
                    datasets: [{
                      label: 'Student-Faculty Ratio',
                      data: data.map(dept => dept['Student-Faculty Ratio']),
                      backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Student-Faculty Ratio by Department'
                      }
                    }
                  }}
                />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <Pie
                  data={{
                    labels: data.map(dept => dept.Department),
                    datasets: [{
                      data: data.map(dept => dept.Budget),
                      backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 159, 64, 0.5)',
                        'rgba(199, 199, 199, 0.5)',
                        'rgba(83, 102, 255, 0.5)',
                      ],
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Budget Distribution'
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">📝 Recommendations</h2>
              {generateRecommendations(data).map((rec, index) => (
                <p key={index} className="mb-2">{rec}</p>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">🤖 AI Insights</h2>
              <button
                onClick={getAiInsights}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? 'Getting insights...' : 'Get AI Insights'}
              </button>
              {aiInsight && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  {aiInsight}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;