import streamlit as st
import pandas as pd
import plotly.express as px
import openai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def ask_ai(prompt):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        return f"Error getting AI response: {str(e)}"

def analyze_department_data(df):
    df['Student-Faculty Ratio'] = df['Students'] / df['Faculty']
    df['Budget per Student'] = df['Budget'] / df['Students']
    return df

def generate_recommendations(df):
    recommendations = []
    for _, row in df.iterrows():
        if row['Student-Faculty Ratio'] > 30:
            recommendations.append(f"🚨 High student-faculty ratio in {row['Department']} ({row['Student-Faculty Ratio']:.1f}:1). Consider hiring more faculty.")
        if row['Budget per Student'] < df['Budget per Student'].mean() * 0.8:
            recommendations.append(f"💰 Low budget per student in {row['Department']} (${row['Budget per Student']:.2f}). Consider budget increase.")
    return recommendations

# Page configuration
st.set_page_config(page_title="University Decision Support System", layout="wide")
st.title("🎓 University Decision Support System")

# File upload
uploaded_file = st.file_uploader("Upload Department Data CSV", type=['csv'])

if uploaded_file:
    try:
        df = pd.read_csv(uploaded_file)
        df = analyze_department_data(df)
        
        # Display key metrics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Students", df['Students'].sum())
        with col2:
            st.metric("Total Faculty", df['Faculty'].sum())
        with col3:
            st.metric("Total Budget", f"${df['Budget'].sum():,.2f}")
        
        # Data visualization
        st.subheader("📊 Department Analysis")
        tab1, tab2, tab3 = st.tabs(["Data", "Student-Faculty Ratio", "Budget Distribution"])
        
        with tab1:
            st.dataframe(df)
        
        with tab2:
            fig1 = px.bar(df, x='Department', y='Student-Faculty Ratio',
                         title='Student-Faculty Ratio by Department')
            st.plotly_chart(fig1)
        
        with tab3:
            fig2 = px.pie(df, values='Budget', names='Department',
                         title='Budget Distribution Across Departments')
            st.plotly_chart(fig2)
        
        # Recommendations
        st.subheader("📝 Recommendations")
        recommendations = generate_recommendations(df)
        for rec in recommendations:
            st.write(rec)
        
        # AI Insights
        if st.button("Get AI Insights"):
            prompt = f"""Analyze this university data and provide strategic insights:
            - Total students: {df['Students'].sum()}
            - Average student-faculty ratio: {df['Student-Faculty Ratio'].mean():.1f}
            - Total budget: ${df['Budget'].sum():,.2f}
            What are the key challenges and opportunities?"""
            
            with st.spinner("Getting AI insights..."):
                ai_response = ask_ai(prompt)
                st.info(ai_response)
                
    except Exception as e:
        st.error(f"Error processing file: {str(e)}")
else:
    st.info("👆 Upload a CSV file to get started! The file should contain columns for Department, Students, Faculty, and Budget.")
    
    # Show sample data option
    if st.button("Use Sample Data"):
        df = pd.read_csv("sample_data.csv")
        st.session_state['data'] = df
        st.experimental_rerun()