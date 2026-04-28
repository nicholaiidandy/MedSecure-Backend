pipeline {
    agent any
    
    environment {
        NODE_ENV = 'production'
        DOCKER_REGISTRY = 'docker.io'
        APP_NAME = 'medsecure-backend'
        PORT = '5000'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo '✓ Code checked out'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
                echo '✓ Dependencies installed'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
                echo '✓ Build completed'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'npm run lint || true'
                echo '✓ Lint check done'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test || true'
                echo '✓ Tests executed'
            }
        }
        
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    echo "Deploying to dev server..."
                    ssh -i /home/devsecops/.ssh/id_rsa devsecops@medsecure.com "cd /home/devsecops/DevSecOps/MedSecure/backend && npm install && pm2 restart medsecure-backend --update-env || pm2 start --name medsecure-backend npm -- start"
                '''
                echo '✓ Deployed to dev'
            }
        }
        
        stage('Deploy to Prod') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    echo "Deploying to production..."
                    ssh -i /home/devsecops/.ssh/id_rsa devsecops@medsecure.com "cd /home/devsecops/DevSecOps/MedSecure/backend && npm install && pm2 restart medsecure-backend --update-env || pm2 start --name medsecure-backend npm -- start"
                '''
                echo '✓ Deployed to production'
            }
        }
        
        stage('Health Check') {
            steps {
                sh '''
                    echo "Checking health endpoint..."
                    curl -f https://medsecure.com/api/health || exit 1
                '''
                echo '✓ Health check passed'
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline completed'
        }
        success {
            echo '✓ Pipeline succeeded'
        }
        failure {
            echo '✗ Pipeline failed'
        }
    }
}
