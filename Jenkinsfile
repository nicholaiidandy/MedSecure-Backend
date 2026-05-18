pipeline {
    agent any

    tools {
        nodejs 'nodejs-20'
    }

    options {
        skipStagesAfterUnstable()
    }

    environment {
        APP_NAME = 'medsecure-backend'
    }

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'master',
                url: 'https://github.com/nicholaiidandy/MedSecure-Backend.git'
            }
        }

        stage('Workspace Info') {
            steps {
                sh '''
                echo "===== WORKSPACE ====="
                pwd
                ls -la

                echo "===== NODE VERSION ====="
                node -v
                npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                echo "===== INSTALL DEPENDENCIES ====="

                npm install
                npm install --save-dev @types/multer
                '''
            }
        }

        stage('Dependency Audit') {
            steps {
                sh '''
                echo "===== NPM AUDIT ====="

                npm audit --audit-level=high || true
                '''
            }
        }

        stage('Build Project') {
            steps {
                sh '''
                echo "===== BUILD PROJECT ====="

                npm run build || true
                '''
            }
        }

        stage('SAST - Semgrep') {
            steps {
                sh '''
                echo "===== SEMGREP SAST ====="

                semgrep --config=auto --exclude .env . || true
                '''
            }
        }

        stage('Run Backend') {
            steps {
                sh '''
                echo "===== RUN BACKEND ====="

                npm install -g pm2

                pm2 delete ${APP_NAME} || true

                pm2 start npm --name ${APP_NAME} -- run dev || \
                pm2 start dist/index.js --name ${APP_NAME} || \
                npm start || true

                sleep 15

                pm2 logs ${APP_NAME} --lines 50 || true
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                echo "===== HEALTH CHECK ====="

                curl http://localhost:3000 || true
                '''
            }
        }

        stage('DAST - OWASP ZAP') {
            steps {
                sh '''
                echo "===== OWASP ZAP DAST ====="

                /opt/zaproxy/zap.sh \
                -cmd \
                -port 8090 \
                -quickurl http://localhost:3000 \
                -quickprogress || true
                '''
            }
        }

        stage('PM2 Status') {
            steps {
                sh '''
                echo "===== PM2 STATUS ====="

                pm2 list || true
                '''
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true

            sh '''
            echo "===== CLEANUP ====="

            pm2 save || true
            '''
        }

        success {
            echo 'Pipeline Success!'
        }

        unstable {
            echo 'Pipeline Unstable!'
        }

        failure {
            echo 'Pipeline Failed!'
        }
    }
}
